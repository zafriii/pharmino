import prisma from "@/lib/prisma";
import { getAppTimezone, getTodayLocalDate, getTodayMidnightInTimezone } from "./utils";



/**
 * Activate the next best batch for an item based on expiry date priority
 * @param itemId - Item ID to activate batch for
 * @param tx - Optional Prisma transaction client
 * @returns Object with activation result
 */
export async function activateNextBestBatch(itemId: number, tx?: any) {
  const client = tx || prisma;

  try {
    // Find the best inactive batch (earliest expiry date, then earliest creation)
    const nextBatch = await client.productBatch.findFirst({
      where: {
        itemId: itemId,
        status: 'INACTIVE',
        quantity: { gt: 0 }
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (nextBatch) {
      await client.productBatch.update({
        where: { id: nextBatch.id },
        data: { status: 'ACTIVE' }
      });

      return {
        success: true,
        activatedBatch: {
          id: nextBatch.id,
          batchNumber: nextBatch.batchNumber,
          expiryDate: nextBatch.expiryDate?.toLocaleDateString(),
          quantity: nextBatch.quantity
        },
        message: `Activated batch ${nextBatch.batchNumber}`
      };
    }

    return {
      success: false,
      message: 'No inactive batches available to activate'
    };

  } catch (error) {
    console.error('Error activating next batch:', error);
    return {
      success: false,
      message: 'Failed to activate next batch',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Ensure the batch with earliest expiry date is active for an item
 * @param itemId - Item ID to optimize batches for
 * @param tx - Optional Prisma transaction client
 * @returns Object with optimization result
 */
export async function optimizeBatchActivation(itemId: number, tx?: any) {
  const client = tx || prisma;

  try {
    // Get all non-expired, non-sold-out batches for this item
    const availableBatches = await client.productBatch.findMany({
      where: {
        itemId: itemId,
        status: { in: ['ACTIVE', 'INACTIVE'] },
        quantity: { gt: 0 }
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (availableBatches.length === 0) {
      return {
        success: false,
        message: 'No available batches to optimize'
      };
    }

    // Find the batch that should be active (earliest expiry date)
    const shouldBeActiveBatch = availableBatches[0];
    const currentActiveBatches = availableBatches.filter((b: any) => b.status === 'ACTIVE');

    // If the earliest expiry batch is already active, no change needed
    if (shouldBeActiveBatch.status === 'ACTIVE') {
      return {
        success: true,
        message: 'Batch activation is already optimized',
        activeBatch: {
          id: shouldBeActiveBatch.id,
          batchNumber: shouldBeActiveBatch.batchNumber,
          expiryDate: shouldBeActiveBatch.expiryDate?.toLocaleDateString()
        }
      };
    }

    // Deactivate all currently active batches
    if (currentActiveBatches.length > 0) {
      await client.productBatch.updateMany({
        where: {
          id: { in: currentActiveBatches.map((b: any) => b.id) }
        },
        data: { status: 'INACTIVE' }
      });
    }

    // Activate the batch with earliest expiry date
    await client.productBatch.update({
      where: { id: shouldBeActiveBatch.id },
      data: { status: 'ACTIVE' }
    });

    return {
      success: true,
      message: `Optimized batch activation - activated batch with earliest expiry`,
      previousActiveBatches: currentActiveBatches.map((b: any) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate?.toLocaleDateString()
      })),
      newActiveBatch: {
        id: shouldBeActiveBatch.id,
        batchNumber: shouldBeActiveBatch.batchNumber,
        expiryDate: shouldBeActiveBatch.expiryDate?.toLocaleDateString()
      }
    };

  } catch (error) {
    console.error('Error optimizing batch activation:', error);
    return {
      success: false,
      message: 'Failed to optimize batch activation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Throttled version of batch checking to prevent excessive DB calls on serverless
 */
let lastCheckTime = 0;
const CHECK_COOLDOWN = 60 * 60 * 1000; // 1 hour

export async function checkAndUpdateExpiredBatchesThrottled() {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN) {
    return { success: true, message: 'Check skipped due to cooldown', throttled: true };
  }

  const result = await checkAndUpdateExpiredBatches();
  if (result.success) {
    lastCheckTime = now;
  }
  return result;
}

/**
 * Check and update expired batches for a specific item or all items
 * @param itemId - Optional item ID to check batches for specific item only
 * @returns Object with updated batch count and details
 */
export async function checkAndUpdateExpiredBatches(itemId?: number) {
  try {
    // Use local date string for comparison against @db.Date field
    const localTodayStr = getTodayLocalDate();

    // console.log(`[BatchExpiry] Checking for expired batches at ${localTodayStr}...`);

    // Safer comparison for @db.Date: everything with expiryDate strictly less than today's local date string
    const whereClause: any = {
      expiryDate: {
        lt: new Date(localTodayStr)
      },
      status: {
        not: 'EXPIRED'
      }
    };

    // If itemId is provided, filter by specific item
    if (itemId) {
      whereClause.itemId = itemId;
    }

    // Find batches that are expired but not marked as EXPIRED
    const expiredBatches = await prisma.productBatch.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            id: true,
            itemName: true
          }
        }
      }
    });

    if (expiredBatches.length > 0) {
      console.log(`[BatchExpiry] Found ${expiredBatches.length} expired batches to update.`);
    }

    if (expiredBatches.length === 0) {
      // Even if no batches expired, optimize batch activation for the item
      if (itemId) {
        const optimizationResult = await optimizeBatchActivation(itemId);
        return {
          success: true,
          updatedCount: 0,
          message: 'No expired batches found',
          batches: [],
          optimizationResult
        };
      }

      return {
        success: true,
        updatedCount: 0,
        message: 'No expired batches found',
        batches: []
      };
    }

    // Group expired batches by item for batch activation optimization and inventory updates
    const expiredBatchesByItem = expiredBatches.reduce((acc, batch) => {
      if (!acc[batch.itemId]) {
        acc[batch.itemId] = [];
      }
      acc[batch.itemId].push(batch);
      return acc;
    }, {} as Record<number, typeof expiredBatches>);

    const result = await prisma.$transaction(async (tx) => {
      // Update expired batches status to EXPIRED
      const updateResult = await tx.productBatch.updateMany({
        where: {
          id: {
            in: expiredBatches.map(batch => batch.id)
          }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      const activationResults: any[] = [];

      // For each item that had expired batches, optimize batch activation
      for (const [itemIdStr, itemExpiredBatches] of Object.entries(expiredBatchesByItem)) {
        const itemIdNum = parseInt(itemIdStr);

        // Check if any of the expired batches were active
        const hadActiveBatch = itemExpiredBatches.some((batch: any) => batch.status === 'ACTIVE');

        if (hadActiveBatch) {
          // Activate the next best batch since an active batch expired
          const activationResult = await activateNextBestBatch(itemIdNum, tx);
          activationResults.push({
            itemId: itemIdNum,
            itemName: itemExpiredBatches[0].item.itemName,
            ...activationResult
          });
        } else {
          // Optimize batch activation to ensure earliest expiry is active
          const optimizationResult = await optimizeBatchActivation(itemIdNum, tx);
          activationResults.push({
            itemId: itemIdNum,
            itemName: itemExpiredBatches[0].item.itemName,
            type: 'optimization',
            ...optimizationResult
          });
        }
      }

      return { updateResult, activationResults };
    });

    const batchDetails = expiredBatches.map(batch => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      itemName: batch.item.itemName,
      expiryDate: batch.expiryDate?.toLocaleDateString(),
      quantity: batch.quantity,
      previousStatus: batch.status
    }));

    return {
      success: true,
      updatedCount: result.updateResult.count,
      message: `Successfully updated ${result.updateResult.count} expired batches`,
      batches: batchDetails,
      activationResults: result.activationResults
    };

  } catch (error) {
    console.error('Error checking and updating expired batches:', error);
    return {
      success: false,
      updatedCount: 0,
      message: 'Failed to update expired batches',
      error: error instanceof Error ? error.message : 'Unknown error',
      batches: []
    };
  }
}

/**
 * Get batch expiry information with formatted dates
 * @param batch - ProductBatch object
 * @returns Object with expiry information
 */
export function getBatchExpiryInfo(batch: any) {
  if (!batch.expiryDate) {
    return {
      isExpired: false,
      expiryDateFormatted: null,
      daysUntilExpiry: null,
      expiryStatus: 'NO_EXPIRY_DATE'
    };
  }

  // Get today's midnight in app timezone for comparison
  const currentDateUTC = getTodayMidnightInTimezone();

  const expiry = new Date(batch.expiryDate);
  // Ensure we compare start of day for the expiry date as well
  const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

  // Batch expires the day AFTER the expiry date
  const isExpired = expiryMidnight < currentDateUTC;
  const daysUntilExpiry = Math.ceil((expiryMidnight.getTime() - currentDateUTC.getTime()) / (1000 * 60 * 60 * 24));

  let expiryStatus = 'VALID';
  if (isExpired) {
    expiryStatus = 'EXPIRED';
  } else if (daysUntilExpiry <= 30) {
    expiryStatus = 'EXPIRING_SOON';
  } else if (daysUntilExpiry <= 90) {
    expiryStatus = 'EXPIRING_WITHIN_3_MONTHS';
  }

  return {
    isExpired,
    expiryDateFormatted: batch.expiryDate.toLocaleDateString('en-US', { timeZone: getAppTimezone() }),
    daysUntilExpiry,
    expiryStatus
  };
}

/**
 * Get all batches with expiry warnings for dashboard/alerts
 * @param daysThreshold - Number of days to consider as "expiring soon" (default: 30)
 * @returns Array of batches expiring soon or expired
 */
export async function getBatchesWithExpiryWarnings(daysThreshold: number = 30) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const batches = await prisma.productBatch.findMany({
      where: {
        expiryDate: {
          lte: futureDate
        },
        status: {
          in: ['ACTIVE', 'INACTIVE']
        },
        quantity: {
          gt: 0
        }
      },
      include: {
        item: {
          select: {
            id: true,
            itemName: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    return batches.map(batch => ({
      ...batch,
      ...getBatchExpiryInfo(batch)
    }));

  } catch (error) {
    console.error('Error fetching batches with expiry warnings:', error);
    return [];
  }
}
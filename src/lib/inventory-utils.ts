import prisma from "@/lib/prisma";

export interface BatchDeduction {
  batchId: number;
  quantity: number;
}

export interface InventoryUpdateResult {
  success: boolean;
  batchDeductions: BatchDeduction[];
  remainingQuantity: number;
  error?: string;
}

/**
 * Deduct quantity from inventory using FIFO (First In, First Out) logic
 * @param itemId - Product ID
 * @param quantityToDeduct - Total quantity to deduct
 * @param tx - Prisma transaction client (optional)
 * @returns Promise<InventoryUpdateResult>
 */
export async function deductFromInventory(
  itemId: number,
  quantityToDeduct: number,
  tx?: any
): Promise<InventoryUpdateResult> {
  const client = tx || prisma;

  try {
    // Get only ACTIVE batches for the item, sorted by expiry date (FIFO)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableBatches = await client.productBatch.findMany({
      where: {
        itemId,
        quantity: { gt: 0 },
        status: 'ACTIVE', // Only sell from ACTIVE batches
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: today } }
        ]
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (availableBatches.length === 0) {
      return {
        success: false,
        batchDeductions: [],
        remainingQuantity: quantityToDeduct,
        error: "No active batches available for sale"
      };
    }

    const totalAvailable = availableBatches.reduce((sum: number, batch: any) => sum + batch.quantity, 0);
    
    if (totalAvailable < quantityToDeduct) {
      return {
        success: false,
        batchDeductions: [],
        remainingQuantity: quantityToDeduct - totalAvailable,
        error: `Insufficient stock. Available: ${totalAvailable}, Required: ${quantityToDeduct}`
      };
    }

    const batchDeductions: BatchDeduction[] = [];
    const batchUpdates: Array<{ id: number; quantity: number; status: string }> = [];
    const batchesToActivate: number[] = [];
    let remainingToDeduct = quantityToDeduct;

    // Calculate all deductions first (no DB calls in loop)
    for (const batch of availableBatches) {
      if (remainingToDeduct <= 0) break;

      const deductFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
      const newQuantity = batch.quantity - deductFromThisBatch;

      batchUpdates.push({
        id: batch.id,
        quantity: newQuantity,
        status: newQuantity === 0 ? 'SOLD_OUT' : batch.status
      });

      batchDeductions.push({
        batchId: batch.id,
        quantity: deductFromThisBatch
      });

      remainingToDeduct -= deductFromThisBatch;

      // Track batches that need activation
      if (newQuantity === 0 && batch.status === 'ACTIVE') {
        batchesToActivate.push(itemId);
      }
    }

    // Perform all batch updates in a single transaction using updateMany where possible
    // For different statuses, we need separate updates
    const soldOutBatches = batchUpdates.filter((b: { status: string }) => b.status === 'SOLD_OUT');
    const activeBatches = batchUpdates.filter((b: { status: string }) => b.status === 'ACTIVE');

    // Batch update sold out batches
    if (soldOutBatches.length > 0) {
      await Promise.all(soldOutBatches.map(batch =>
        client.productBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity, status: 'SOLD_OUT' }
        })
      ));
    }

    // Batch update active batches
    if (activeBatches.length > 0) {
      await Promise.all(activeBatches.map(batch =>
        client.productBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity }
        })
      ));
    }

    // Activate next inactive batches if needed (batch this too)
    if (batchesToActivate.length > 0) {
      // Get all inactive batches for this item at once
      const inactiveBatches = await client.productBatch.findMany({
        where: {
          itemId,
          status: 'INACTIVE',
          quantity: { gt: 0 }
        },
        orderBy: [
          { expiryDate: 'asc' },
          { createdAt: 'asc' }
        ],
        take: batchesToActivate.length // Only get as many as we need
      });

      // Activate them all at once
      if (inactiveBatches.length > 0) {
        await client.productBatch.updateMany({
          where: {
            id: { in: inactiveBatches.map((b: any) => b.id) }
          },
          data: { status: 'ACTIVE' }
        });
      }
    }

    // Update inventory record (single query)
    const inventory = await client.inventory.findUnique({
      where: { productId: itemId }
    });

    if (inventory) {
      const newTotalQuantity = inventory.totalQuantity - quantityToDeduct;
      const newAvailableQuantity = inventory.availableQuantity - quantityToDeduct;

      let newStatus = inventory.status;
      if (newTotalQuantity === 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newTotalQuantity < inventory.lowStockThreshold) {
        newStatus = 'LOW_STOCK';
      } else {
        newStatus = 'IN_STOCK';
      }

      await client.inventory.update({
        where: { productId: itemId },
        data: {
          totalQuantity: newTotalQuantity,
          availableQuantity: newAvailableQuantity,
          status: newStatus,
          lastUpdated: new Date()
        }
      });
    }

    return {
      success: true,
      batchDeductions,
      remainingQuantity: 0
    };

  } catch (error) {
    console.error("Error deducting from inventory:", error);
    return {
      success: false,
      batchDeductions: [],
      remainingQuantity: quantityToDeduct,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Add quantity back to inventory (for returns)
 * @param batchDeductions - Array of batch deductions to reverse
 * @param tx - Prisma transaction client (optional)
 */
export async function addBackToInventory(
  batchDeductions: BatchDeduction[],
  tx?: any
): Promise<boolean> {
  const client = tx || prisma;

  try {
    // Get all batches at once
    const batchIds = batchDeductions.map(d => d.batchId);
    const batches = await client.productBatch.findMany({
      where: { id: { in: batchIds } }
    });

    // Group deductions by itemId for inventory updates
    const inventoryUpdates = new Map<number, number>();
    const batchUpdates = [];

    for (const deduction of batchDeductions) {
      const batch = batches.find((b: any) => b.id === deduction.batchId);
      if (batch) {
        const newQuantity = batch.quantity + deduction.quantity;
        
        batchUpdates.push({
          id: batch.id,
          quantity: newQuantity,
          status: batch.status === 'SOLD_OUT' ? 'ACTIVE' : batch.status
        });

        // Accumulate inventory updates by itemId
        const currentUpdate = inventoryUpdates.get(batch.itemId) || 0;
        inventoryUpdates.set(batch.itemId, currentUpdate + deduction.quantity);
      }
    }

    // Batch update all product batches
    await Promise.all(
      batchUpdates.map(update =>
        client.productBatch.update({
          where: { id: update.id },
          data: { quantity: update.quantity, status: update.status }
        })
      )
    );

    // Batch update all inventory records
    const inventoryPromises = Array.from(inventoryUpdates.entries()).map(async ([itemId, quantityToAdd]) => {
      const inventory = await client.inventory.findUnique({
        where: { productId: itemId }
      });

      if (inventory) {
        const newTotalQuantity = inventory.totalQuantity + quantityToAdd;
        const newAvailableQuantity = inventory.availableQuantity + quantityToAdd;

        let newStatus = inventory.status;
        if (newTotalQuantity >= inventory.lowStockThreshold) {
          newStatus = 'IN_STOCK';
        } else if (newTotalQuantity > 0) {
          newStatus = 'LOW_STOCK';
        }

        return client.inventory.update({
          where: { productId: itemId },
          data: {
            totalQuantity: newTotalQuantity,
            availableQuantity: newAvailableQuantity,
            status: newStatus,
            lastUpdated: new Date()
          }
        });
      }
    });

    await Promise.all(inventoryPromises.filter(Boolean));

    return true;
  } catch (error) {
    console.error("Error adding back to inventory:", error);
    return false;
  }
}

/**
 * Get current inventory status for an item
 * @param itemId - Product ID
 */
export async function getInventoryStatus(itemId: number) {
  const inventory = await prisma.inventory.findUnique({
    where: { productId: itemId },
    include: {
      product: {
        include: {
          batches: {
            where: {
              quantity: { gt: 0 },
              status: { in: ['ACTIVE', 'INACTIVE'] }
            },
            orderBy: [
              { expiryDate: 'asc' },
              { createdAt: 'asc' }
            ]
          }
        }
      }
    }
  });

  return inventory;
}
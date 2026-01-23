import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";
import { optimizeBatchActivation, activateNextBestBatch } from "@/lib/batch-expiry-utils";

// POST /api/admin/inventory/optimize-batches - Optimize batch activation for items
export async function POST(request: NextRequest) {
  try {
    await requireEvery();

    const body = await request.json().catch(() => ({}));
    const { itemId, itemIds, action = 'optimize' } = body;

    if (!itemId && !itemIds) {
      return errorResponse("Either itemId or itemIds array is required", 400);
    }

    const targetItemIds = itemId ? [itemId] : itemIds;
    const results = [];

    for (const targetItemId of targetItemIds) {
      let result;
      
      if (action === 'activate_next') {
        result = await activateNextBestBatch(targetItemId);
      } else {
        result = await optimizeBatchActivation(targetItemId);
      }

      results.push({
        itemId: targetItemId,
        ...result
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return successResponse({
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      message: `Batch optimization completed. ${successCount}/${totalCount} items processed successfully.`
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error in batch optimization:", error);
    return errorResponse("Failed to optimize batches", 500);
  }
}

// GET /api/admin/inventory/optimize-batches - Get batch optimization recommendations
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    // This endpoint analyzes current batch status and provides recommendations
    // without making changes
    
    const whereClause: any = {
      status: { in: ['ACTIVE', 'INACTIVE'] },
      quantity: { gt: 0 }
    };

    if (itemId) {
      whereClause.itemId = parseInt(itemId);
    }

    const batches = await prisma.productBatch.findMany({
      where: whereClause,
      include: {
        item: {
          select: {
            id: true,
            itemName: true
          }
        }
      },
      orderBy: [
        { itemId: 'asc' },
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Group batches by item
    const batchesByItem = batches.reduce((acc, batch) => {
      if (!acc[batch.itemId]) {
        acc[batch.itemId] = {
          itemId: batch.itemId,
          itemName: batch.item.itemName,
          batches: []
        };
      }
      acc[batch.itemId].batches.push(batch);
      return acc;
    }, {} as Record<number, any>);

    const recommendations = [];

    for (const [itemIdStr, itemData] of Object.entries(batchesByItem)) {
      const itemBatches = itemData.batches;
      const activeBatches = itemBatches.filter((b: any) => b.status === 'ACTIVE');
      const inactiveBatches = itemBatches.filter((b: any) => b.status === 'INACTIVE');
      
      // Sort by expiry date to find the earliest
      const sortedBatches = [...itemBatches].sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

      const earliestExpiryBatch = sortedBatches[0];
      const isOptimal = earliestExpiryBatch.status === 'ACTIVE';

      recommendations.push({
        itemId: parseInt(itemIdStr),
        itemName: itemData.itemName,
        isOptimal,
        currentActiveBatches: activeBatches.map((b: any) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate?.toLocaleDateString(),
          quantity: b.quantity
        })),
        recommendedActiveBatch: {
          id: earliestExpiryBatch.id,
          batchNumber: earliestExpiryBatch.batchNumber,
          expiryDate: earliestExpiryBatch.expiryDate?.toLocaleDateString(),
          quantity: earliestExpiryBatch.quantity,
          isCurrentlyActive: earliestExpiryBatch.status === 'ACTIVE'
        },
        totalBatches: itemBatches.length,
        activeBatchesCount: activeBatches.length,
        inactiveBatchesCount: inactiveBatches.length
      });
    }

    const nonOptimalCount = recommendations.filter(r => !r.isOptimal).length;

    return successResponse({
      recommendations,
      summary: {
        totalItems: recommendations.length,
        optimalItems: recommendations.length - nonOptimalCount,
        needsOptimization: nonOptimalCount
      },
      message: `Found ${nonOptimalCount} items that need batch optimization`
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error getting batch optimization recommendations:", error);
    return errorResponse("Failed to get batch recommendations", 500);
  }
}
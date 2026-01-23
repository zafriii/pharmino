import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/received-items - Get all received order prodcucts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get('search');

    const where: any = {};
    
    if (search) {
      where.purchaseItem = {
        item: {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { genericName: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const total = await prisma.receivedItem.count({ where });

    if (total === 0) {
      return successResponse({
        receivedItems: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const receivedItems = await prisma.receivedItem.findMany({
      where,
      include: {
        purchaseItem: {
          include: {
            item: {
              include: {
                category: true
              }
            },
            purchaseOrder: true
          }
        },
        batches: {
          where: {
            receivedItemId: {
              not: null // Only include batches that are linked to this specific received item
            }
          }
        }
      },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter items that haven't been fully converted to batches and add status
    const itemsWithStatus = await Promise.all(receivedItems.map(async (receivedItem) => {
      // Only count batches that were created from THIS specific received item
      const relevantBatches = receivedItem.batches.filter(batch => batch.receivedItemId === receivedItem.id);
      
      // Calculate ORIGINAL batch quantities by adding current quantity + total sold
      let originalBatchQuantity = 0;
      
      for (const batch of relevantBatches) {
        // Get total sold from this batch
        const soldFromBatch = await prisma.saleBatch.aggregate({
          where: { batchId: batch.id },
          _sum: { quantity: true }
        });
        
        const totalSold = soldFromBatch._sum.quantity || 0;
        const originalQuantity = batch.quantity + totalSold; // Current + Sold = Original
        originalBatchQuantity += originalQuantity;
      }
      
      const remainingQuantity = Math.max(0, receivedItem.receivedQuantity - originalBatchQuantity);
      
      // An item is fully processed if all received quantity has been converted to batches
      // regardless of whether those batches have been sold or not
      const isFullyProcessed = originalBatchQuantity >= receivedItem.receivedQuantity;
      const canAddToInventory = !isFullyProcessed && remainingQuantity > 0;
      
      // Debug logging for Napa and Indever items
      if (receivedItem.purchaseItem.item.itemName.toLowerCase().includes('napa') || 
          receivedItem.purchaseItem.item.itemName.toLowerCase().includes('indever')) {
        console.log(`=== ${receivedItem.purchaseItem.item.itemName.toUpperCase()} DEBUG ===`);
        console.log('Received Item ID:', receivedItem.id);
        console.log('PO ID:', receivedItem.purchaseItem.purchaseOrder.id);
        console.log('Received Quantity:', receivedItem.receivedQuantity);
        console.log('Relevant Batches Count:', relevantBatches.length);
        console.log('Current Batch Quantities:', relevantBatches.map(b => b.quantity));
        console.log('Original Batch Quantity (FIXED):', originalBatchQuantity);
        console.log('Remaining Quantity:', remainingQuantity);
        console.log('Is Fully Processed:', isFullyProcessed);
        console.log('Can Add To Inventory:', canAddToInventory);
        
        // Show detailed batch info
        for (const batch of relevantBatches) {
          const soldFromBatch = await prisma.saleBatch.aggregate({
            where: { batchId: batch.id },
            _sum: { quantity: true }
          });
          const totalSold = soldFromBatch._sum.quantity || 0;
          const originalQuantity = batch.quantity + totalSold;
          console.log(`  Batch ${batch.id}: current=${batch.quantity}, sold=${totalSold}, original=${originalQuantity}`);
        }
      }
      
      return {
        ...receivedItem,
        remainingQuantity,
        isFullyProcessed,
        canAddToInventory
      };
    }));

    return successResponse({
      receivedItems: itemsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in received-items API:", error);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching received items:", error);
    return errorResponse("Failed to fetch received items", 500);
  }
}
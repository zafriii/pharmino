import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// POST /api/debug/fix-batches - Fix corrupted batch quantities
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    console.log("🔧 Starting batch quantity repair...");

    // Find all batches with quantity 0 that have sales records
    const corruptedBatches = await prisma.productBatch.findMany({
      where: {
        quantity: 0
      },
      include: {
        receivedItem: true,
        item: {
          select: { itemName: true }
        }
      }
    });

    console.log(`Found ${corruptedBatches.length} batches with quantity 0`);

    const fixedBatches = [];

    for (const batch of corruptedBatches) {
      // Calculate total sold from this batch
      const totalSold = await prisma.saleBatch.aggregate({
        where: { batchId: batch.id },
        _sum: { quantity: true }
      });

      const soldQuantity = totalSold._sum.quantity || 0;
      
      if (soldQuantity > 0) {
        // The original quantity should be current quantity + sold quantity
        const originalQuantity = batch.quantity + soldQuantity;
        
        console.log(`Fixing Batch ${batch.id} (${batch.batchNumber}) for ${batch.item.itemName}: ${batch.quantity} -> ${originalQuantity} (sold: ${soldQuantity})`);
        
        // Update the batch with the correct original quantity
        await prisma.productBatch.update({
          where: { id: batch.id },
          data: {
            quantity: originalQuantity,
            // Keep status as SOLD_OUT if it was fully consumed
            status: soldQuantity >= originalQuantity ? 'SOLD_OUT' : 'ACTIVE'
          }
        });
        
        fixedBatches.push({
          id: batch.id,
          batchNumber: batch.batchNumber,
          itemName: batch.item.itemName,
          oldQuantity: batch.quantity,
          newQuantity: originalQuantity,
          soldQuantity
        });
      } else {
        console.log(`Batch ${batch.id} (${batch.batchNumber}) for ${batch.item.itemName} has quantity 0 but no sales - might be genuinely empty`);
      }
    }

    // Also check for any cross-contamination issues
    console.log("\n🔍 Checking for cross-contamination issues...");
    
    const allReceivedItems = await prisma.receivedItem.findMany({
      include: {
        batches: true,
        purchaseItem: {
          include: {
            item: true,
            purchaseOrder: true
          }
        }
      }
    });

    const issues = [];
    for (const receivedItem of allReceivedItems) {
      const totalBatchQuantity = receivedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const remainingQuantity = Math.max(0, receivedItem.receivedQuantity - totalBatchQuantity);
      
      if (remainingQuantity > 0) {
        issues.push({
          receivedItemId: receivedItem.id,
          poId: receivedItem.purchaseItem.purchaseOrder.id,
          itemName: receivedItem.purchaseItem.item.itemName,
          received: receivedItem.receivedQuantity,
          batches: totalBatchQuantity,
          remaining: remainingQuantity,
          batchDetails: receivedItem.batches.map(b => ({
            id: b.id,
            batchNumber: b.batchNumber,
            quantity: b.quantity,
            status: b.status
          }))
        });
      }
    }

    console.log("🎉 Batch quantity repair completed!");

    return successResponse({
      message: `Successfully fixed ${fixedBatches.length} corrupted batches`,
      fixedBatches,
      remainingIssues: issues
    });

  } catch (error) {
    console.error("❌ Error during repair:", error);
    return errorResponse("Failed to fix batch quantities", 500);
  }
}
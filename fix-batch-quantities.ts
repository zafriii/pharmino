// Data repair script to fix corrupted batch quantities
// This script will restore original batch quantities based on sales data

import prisma from "@/lib/prisma";

async function fixBatchQuantities() {
  console.log("🔧 Starting batch quantity repair...");

  try {
    // Find all batches with quantity 0 that have sales records
    const corruptedBatches = await prisma.productBatch.findMany({
      where: {
        quantity: 0,
        saleItems: {
          some: {} // Has at least one sale record
        }
      },
      include: {
        saleItems: {
          include: {
            batches: {
              where: {
                batchId: undefined // Will be set dynamically
              }
            }
          }
        },
        receivedItem: true
      }
    });

    console.log(`Found ${corruptedBatches.length} corrupted batches`);

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
        
        console.log(`Batch ${batch.id} (${batch.batchNumber}):`);
        console.log(`  Current quantity: ${batch.quantity}`);
        console.log(`  Total sold: ${soldQuantity}`);
        console.log(`  Restoring to original: ${originalQuantity}`);
        
        // Update the batch with the correct original quantity
        await prisma.productBatch.update({
          where: { id: batch.id },
          data: {
            quantity: originalQuantity,
            // Keep status as SOLD_OUT if it was fully consumed
            status: soldQuantity >= originalQuantity ? 'SOLD_OUT' : 'ACTIVE'
          }
        });
        
        console.log(`  ✅ Fixed batch ${batch.batchNumber}`);
      }
    }

    console.log("🎉 Batch quantity repair completed!");
    
    // Now verify the fix by checking received items
    console.log("\n🔍 Verifying received items...");
    
    const receivedItems = await prisma.receivedItem.findMany({
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

    for (const receivedItem of receivedItems) {
      const totalBatchQuantity = receivedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const remainingQuantity = Math.max(0, receivedItem.receivedQuantity - totalBatchQuantity);
      
      if (remainingQuantity > 0) {
        console.log(`⚠️  Received Item ${receivedItem.id} (PO: ${receivedItem.purchaseItem.purchaseOrder.id}):`);
        console.log(`   Product: ${receivedItem.purchaseItem.item.itemName}`);
        console.log(`   Received: ${receivedItem.receivedQuantity}, Batches: ${totalBatchQuantity}, Remaining: ${remainingQuantity}`);
      } else {
        console.log(`✅ Received Item ${receivedItem.id} - Fully processed`);
      }
    }

  } catch (error) {
    console.error("❌ Error during repair:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the repair
fixBatchQuantities();
// Debug script to check received item and its batches
// Run this in your database or create a temporary API endpoint

import prisma from "@/lib/prisma";

async function debugReceivedItem() {
  // Find the ACI item from the purchase order
  const receivedItem = await prisma.receivedItem.findFirst({
    where: {
      purchaseItem: {
        purchaseOrder: {
          id: "cmk8rwed10001jp05147lrvl" // The PO ID from your screenshot
        },
        item: {
          itemName: {
            contains: "ACI",
            mode: 'insensitive'
          }
        }
      }
    },
    include: {
      purchaseItem: {
        include: {
          item: true,
          purchaseOrder: true
        }
      },
      batches: {
        include: {
          item: true
        }
      }
    }
  });

  if (receivedItem) {
    console.log("=== RECEIVED ITEM DEBUG ===");
    console.log("Received Item ID:", receivedItem.id);
    console.log("Item Name:", receivedItem.purchaseItem.item.itemName);
    console.log("Received Quantity:", receivedItem.receivedQuantity);
    console.log("Received At:", receivedItem.receivedAt);
    
    console.log("\n=== BATCHES ===");
    console.log("Number of batches:", receivedItem.batches.length);
    
    let totalBatchQuantity = 0;
    receivedItem.batches.forEach((batch, index) => {
      console.log(`Batch ${index + 1}:`);
      console.log(`  - ID: ${batch.id}`);
      console.log(`  - Batch Number: ${batch.batchNumber}`);
      console.log(`  - Quantity: ${batch.quantity}`);
      console.log(`  - Status: ${batch.status}`);
      console.log(`  - Created At: ${batch.createdAt}`);
      totalBatchQuantity += batch.quantity;
    });
    
    console.log("\n=== CALCULATION ===");
    console.log("Total Batch Quantity:", totalBatchQuantity);
    console.log("Remaining Quantity:", receivedItem.receivedQuantity - totalBatchQuantity);
    console.log("Should be fully processed:", (receivedItem.receivedQuantity - totalBatchQuantity) <= 0);
  } else {
    console.log("Received item not found");
  }
}

// Call the function
debugReceivedItem().catch(console.error);
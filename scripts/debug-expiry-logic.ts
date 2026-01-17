#!/usr/bin/env tsx

/**
 * Debug script to understand the expiry logic issue
 */

import prisma from '../src/lib/prisma';

async function main() {
  console.log('🔍 Debugging expiry logic...');
  
  const currentDate = new Date();
  console.log('📅 Current Date Object:', currentDate);
  console.log('📅 Current Date ISO:', currentDate.toISOString());
  console.log('📅 Current Date Local String:', currentDate.toLocaleDateString());
  
  // Reset to start of day in local timezone (same as batch-expiry-utils.ts)
  const currentDateLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  console.log('📅 Current Date Local (start of day):', currentDateLocal);
  console.log('📅 Current Date Local ISO:', currentDateLocal.toISOString());
  
  // Get the specific batch
  const napaBatch = await prisma.productBatch.findFirst({
    where: {
      batchNumber: 'NAPA-004'
    },
    include: {
      item: {
        select: {
          itemName: true
        }
      }
    }
  });
  
  if (napaBatch) {
    console.log('\n📦 Found NAPA-004 batch:');
    console.log('   Item:', napaBatch.item.itemName);
    console.log('   Batch Number:', napaBatch.batchNumber);
    console.log('   Status:', napaBatch.status);
    console.log('   Expiry Date Object:', napaBatch.expiryDate);
    console.log('   Expiry Date ISO:', napaBatch.expiryDate?.toISOString());
    console.log('   Expiry Date Local String:', napaBatch.expiryDate?.toLocaleDateString());
    
    if (napaBatch.expiryDate) {
      const expiryLocal = new Date(napaBatch.expiryDate.getFullYear(), napaBatch.expiryDate.getMonth(), napaBatch.expiryDate.getDate());
      console.log('   Expiry Date Local (start of day):', expiryLocal);
      console.log('   Expiry Date Local ISO:', expiryLocal.toISOString());
      
      console.log('\n🔍 Comparison Logic:');
      console.log('   Current Date Local:', currentDateLocal.getTime());
      console.log('   Expiry Date Local:', expiryLocal.getTime());
      console.log('   Is expiryLocal < currentDateLocal?', expiryLocal < currentDateLocal);
      console.log('   Is expiryLocal <= currentDateLocal?', expiryLocal <= currentDateLocal);
      console.log('   Time difference (ms):', currentDateLocal.getTime() - expiryLocal.getTime());
      console.log('   Days difference:', (currentDateLocal.getTime() - expiryLocal.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Test the where clause used in checkAndUpdateExpiredBatches
    console.log('\n🔍 Testing database query with new logic:');
    
    // Use the same logic as the updated checkAndUpdateExpiredBatches
    const currentDateLocalForLogic = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const currentDateUTC = new Date(Date.UTC(
      currentDateLocalForLogic.getFullYear(), 
      currentDateLocalForLogic.getMonth(), 
      currentDateLocalForLogic.getDate()
    ));
    
    console.log('   Current Date Local (for logic):', currentDateLocalForLogic);
    console.log('   Current Date UTC (for DB query):', currentDateUTC);
    
    const expiredBatches = await prisma.productBatch.findMany({
      where: {
        expiryDate: {
          lt: currentDateUTC
        },
        status: {
          not: 'EXPIRED'
        }
      },
      include: {
        item: {
          select: {
            itemName: true
          }
        }
      }
    });
    
    console.log('   Found expired batches:', expiredBatches.length);
    expiredBatches.forEach(batch => {
      console.log(`   - ${batch.item.itemName} (${batch.batchNumber}): ${batch.expiryDate?.toLocaleDateString()}`);
    });
    
  } else {
    console.log('\n❌ NAPA-004 batch not found');
  }
}

main().then(() => {
  console.log('\n🎉 Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
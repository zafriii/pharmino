#!/usr/bin/env tsx

/**
 * Script to manually check and update expired batches
 * This will update the database status for batches that have expired
 */

import { checkAndUpdateExpiredBatches } from '../src/lib/batch-expiry-utils';

async function main() {
  console.log('🔄 Starting manual batch expiry check...');
  console.log('📅 Current date:', new Date().toLocaleDateString());
  
  try {
    const result = await checkAndUpdateExpiredBatches();
    
    console.log('\n✅ Batch expiry check completed:');
    console.log(`   Updated batches: ${result.updatedCount}`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    
    if (result.batches && result.batches.length > 0) {
      console.log('\n📋 Updated batches:');
      result.batches.forEach((batch, index) => {
        console.log(`   ${index + 1}. ${batch.itemName} - Batch: ${batch.batchNumber}`);
        console.log(`      Expiry: ${batch.expiryDate}, Quantity: ${batch.quantity}`);
        console.log(`      Status: ${batch.previousStatus} → EXPIRED`);
      });
    }
    
    if (result.activationResults && result.activationResults.length > 0) {
      console.log('\n🔄 Batch activation results:');
      result.activationResults.forEach((activation, index) => {
        console.log(`   ${index + 1}. ${activation.itemName}:`);
        console.log(`      Success: ${activation.success}`);
        console.log(`      Message: ${activation.message}`);
        if (activation.activatedBatch) {
          console.log(`      Activated: ${activation.activatedBatch.batchNumber} (Expiry: ${activation.activatedBatch.expiryDate})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Batch expiry check failed:', error);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n🎉 Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
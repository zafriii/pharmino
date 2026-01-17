#!/usr/bin/env tsx

/**
 * Script to check current batch status and expiry information
 */

import prisma from '../src/lib/prisma';
import { getBatchExpiryInfo } from '../src/lib/batch-expiry-utils';
import { isBatchExpired } from '../src/lib/batch-utils';

async function main() {
  console.log('🔍 Checking current batch status...');
  console.log('📅 Current date:', new Date().toLocaleDateString());
  console.log('🕐 Current time:', new Date().toLocaleString());
  
  try {
    // Get all batches with their expiry information
    const batches = await prisma.productBatch.findMany({
      include: {
        item: {
          select: {
            itemName: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });
    
    console.log(`\n📦 Found ${batches.length} total batches`);
    
    // Filter batches that have expiry dates
    const batchesWithExpiry = batches.filter(batch => batch.expiryDate);
    console.log(`📅 ${batchesWithExpiry.length} batches have expiry dates`);
    
    // Check for batches around today's date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    console.log('\n🔍 Batches with expiry dates around today:');
    
    let foundRelevantBatches = false;
    
    for (const batch of batchesWithExpiry) {
      const expiryDate = new Date(batch.expiryDate!);
      const expiryInfo = getBatchExpiryInfo(batch);
      
      // Show batches that expire yesterday, today, or tomorrow
      if (expiryDate >= yesterday && expiryDate <= tomorrow) {
        foundRelevantBatches = true;
        console.log(`\n   📦 ${batch.item.itemName} - Batch: ${batch.batchNumber}`);
        console.log(`      Expiry Date: ${expiryDate.toLocaleDateString()}`);
        console.log(`      Database Status: ${batch.status}`);
        console.log(`      Is Expired (logic): ${expiryInfo.isExpired}`);
        console.log(`      Days until expiry: ${expiryInfo.daysUntilExpiry}`);
        console.log(`      Expiry Status: ${expiryInfo.expiryStatus}`);
        console.log(`      Quantity: ${batch.quantity}`);
        
        // Check with our batch utility function
        const isExpiredByUtil = isBatchExpired(batch.expiryDate?.toISOString() || null);
        console.log(`      Is Expired (utility): ${isExpiredByUtil}`);
      }
    }
    
    if (!foundRelevantBatches) {
      console.log('   No batches found with expiry dates around today');
      
      // Show the next few batches that will expire
      console.log('\n📅 Next batches to expire:');
      const nextBatches = batchesWithExpiry
        .filter(batch => new Date(batch.expiryDate!) > today)
        .slice(0, 5);
        
      nextBatches.forEach((batch, index) => {
        const expiryDate = new Date(batch.expiryDate!);
        console.log(`   ${index + 1}. ${batch.item.itemName} - ${batch.batchNumber}`);
        console.log(`      Expiry: ${expiryDate.toLocaleDateString()}, Status: ${batch.status}`);
      });
    }
    
    // Check for any batches that contain "Napa" in the item name
    console.log('\n🔍 Searching for Napa-related batches:');
    const napaBatches = batches.filter(batch => 
      batch.item.itemName.toLowerCase().includes('napa') || 
      batch.batchNumber.toLowerCase().includes('napa')
    );
    
    if (napaBatches.length > 0) {
      napaBatches.forEach(batch => {
        const expiryInfo = getBatchExpiryInfo(batch);
        console.log(`   📦 ${batch.item.itemName} - Batch: ${batch.batchNumber}`);
        console.log(`      Expiry: ${batch.expiryDate?.toLocaleDateString() || 'No expiry'}`);
        console.log(`      Status: ${batch.status}`);
        console.log(`      Is Expired: ${expiryInfo.isExpired}`);
        console.log(`      Quantity: ${batch.quantity}`);
      });
    } else {
      console.log('   No Napa-related batches found');
    }
    
  } catch (error) {
    console.error('❌ Error checking batch status:', error);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n🎉 Check completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});
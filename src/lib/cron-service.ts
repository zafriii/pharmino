import cron, { ScheduledTask } from 'node-cron';
import { checkAndUpdateExpiredBatches } from './batch-expiry-utils';

// Store cron jobs
let batchExpiryJob: ScheduledTask | null = null;
let isInitialized = false;

/**
 * Initialize and start all cron jobs
 * This should be called once when the server starts
 */
export function startCronJobs() {
  if (isInitialized) {
    console.log('⏰ Cron jobs already initialized');
    return;
  }

  try {
    // Get system's local timezone
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Batch Expiry Check - Every day at midnight in system's local timezone
    batchExpiryJob = cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Running scheduled batch expiry check...');
      console.log('📅 Current local time:', new Date().toLocaleString());
      try {
        const result = await checkAndUpdateExpiredBatches();
        console.log('✅ Batch expiry check completed:', {
          updatedCount: result.updatedCount,
          success: result.success,
          message: result.message
        });
        
        if (result.activationResults && result.activationResults.length > 0) {
          console.log('📋 Batch activation results:', result.activationResults.map(r => ({
            itemName: r.itemName,
            success: r.success,
            message: r.message
          })));
        }
      } catch (error) {
        console.error('❌ Batch expiry check failed:', error);
      }
    }, {
      timezone: systemTimezone
    });

    isInitialized = true;
    console.log('✅ Cron jobs initialized successfully');
    console.log(`⏰ Batch expiry check: Every day at midnight (00:00 ${systemTimezone})`);
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
  }
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs() {
  if (batchExpiryJob) {
    batchExpiryJob.stop();
    batchExpiryJob = null;
  }
  
  isInitialized = false;
  console.log('🛑 Cron jobs stopped');
}

/**
 * Get status of all cron jobs
 */
export function getCronStatus() {
  return {
    initialized: isInitialized,
    batchExpiryJob: {
      active: batchExpiryJob !== null,
      running: batchExpiryJob ? (batchExpiryJob as any).running : false
    }
  };
}


// import { NextRequest } from "next/server";
// import { errorResponse, successResponse } from "@/lib/auth-utils";
// import { checkAndUpdateExpiredBatches } from "@/lib/batch-expiry-utils";

// // POST /api/admin/cron/check-expired-batches - Cron job to check all expired batches
// export async function POST(request: NextRequest) {
//   try {
//     // Verify this is a legitimate cron request (you might want to add authentication)
//     const authHeader = request.headers.get('authorization');
//     const cronSecret = process.env.CRON_SECRET;
    
//     if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
//       return errorResponse("Unauthorized cron request", 401);
//     }

//     console.log('Starting scheduled batch expiry check...');
    
//     // Check and update all expired batches (no itemId specified)
//     const updateResult = await checkAndUpdateExpiredBatches();
    
//     console.log('Batch expiry check completed:', updateResult);

//     return successResponse({
//       ...updateResult,
//       timestamp: new Date().toISOString(),
//       message: `Cron job completed. ${updateResult.updatedCount} batches updated to EXPIRED status.`
//     });

//   } catch (error) {
//     console.error("Error in cron batch expiry check:", error);
//     return errorResponse("Failed to run cron batch expiry check", 500);
//   }
// }

// // // GET /api/admin/cron/check-expired-batches - Manual trigger for testing
// // export async function GET() {
// //   try {
// //     console.log('Manual batch expiry check triggered...');
    
// //     const updateResult = await checkAndUpdateExpiredBatches();
    
// //     return successResponse({
// //       ...updateResult,
// //       timestamp: new Date().toISOString(),
// //       message: `Manual check completed. ${updateResult.updatedCount} batches updated to EXPIRED status.`
// //     });

// //   } catch (error) {
// //     console.error("Error in manual batch expiry check:", error);
// //     return errorResponse("Failed to run manual batch expiry check", 500);
// //   }
// // }






import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/auth-utils";
import { checkAndUpdateExpiredBatches } from "@/lib/batch-expiry-utils";

// Shared handler for both GET and POST
async function handleCronRequest(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check for bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also allow checking via query param for easier manual testing if secret is provided
      const { searchParams } = new URL(request.url);
      const queryKey = searchParams.get('key');
      
      if (queryKey !== cronSecret) {
        return errorResponse("Unauthorized cron request", 401);
      }
    }

    console.log('[Cron] Starting scheduled batch expiry check...');
    
    // Check and update all expired batches (no itemId specified)
    const updateResult = await checkAndUpdateExpiredBatches();
    
    console.log('[Cron] Batch expiry check completed:', updateResult);

    return successResponse({
      ...updateResult,
      timestamp: new Date().toISOString(),
      message: `Cron job completed. ${updateResult.updatedCount} batches updated to EXPIRED status.`
    });

  } catch (error) {
    console.error("[Cron] Error in cron batch expiry check:", error);
    return errorResponse("Failed to run cron batch expiry check", 500);
  }
}

// POST /api/admin/cron/check-expired-batches - Official cron trigger
export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}

// GET /api/admin/cron/check-expired-batches - Alternative trigger (Vercel cron compatibility)
export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}



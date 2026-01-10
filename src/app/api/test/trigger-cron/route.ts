import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/auth-utils";
import { checkAndUpdateExpiredBatches } from "@/lib/batch-expiry-utils";

/**
 * TEST ENDPOINT - Only for development/testing
 * 
 * This endpoint allows you to manually trigger cron jobs
 * without needing external cron services or waiting for scheduled runs.
 * 
 * Usage:
 * - Batch expiry: GET http://localhost:3000/api/test/trigger-cron
 * - Batch expiry: GET http://localhost:3000/api/test/trigger-cron?type=batch
 * - Specific item: GET http://localhost:3000/api/test/trigger-cron?type=batch&itemId=123
 * 
 * ⚠️ WARNING: This endpoint is disabled in production for security.
 * Delete this file before deploying to production, or keep it disabled.
 */
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === "production") {
    return errorResponse("This endpoint is not available in production", 403);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "batch";
  const itemId = searchParams.get("itemId");

  try {
    console.log(`🧪 TEST: Manually triggering ${type} cron job...`);
    console.log("⏰ Current time:", new Date().toLocaleString());
    
    let result;
    
    if (type === "batch") {
      const itemIdNum = itemId ? parseInt(itemId) : undefined;
      result = await checkAndUpdateExpiredBatches(itemIdNum);
      console.log("✅ TEST: Batch expiry check completed successfully");
      console.log("📊 Results:", JSON.stringify(result, null, 2));

      return successResponse({
        testMessage: "TEST: Batch expiry check completed successfully",
        environment: process.env.NODE_ENV,
        type: "batch",
        itemId: itemIdNum,
        ...result,
      });
    } else {
      return errorResponse("Invalid type. Use 'batch' for batch expiry check", 400);
    }
  } catch (error) {
    console.error(`❌ TEST: Error in ${type} cron job:`, error);
    return errorResponse(
      `Failed to run ${type} cron job: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}

import { NextRequest } from "next/server";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";
import { checkAndUpdateExpiredBatches, getBatchesWithExpiryWarnings } from "@/lib/batch-expiry-utils";

// POST /api/admin/inventory/check-expiry - Check and update expired batches
export async function POST(request: NextRequest) {
  try {
    await requireEvery();

    const body = await request.json().catch(() => ({}));
    const { itemId, daysThreshold = 30 } = body;

    // Check and update expired batches
    const updateResult = await checkAndUpdateExpiredBatches(itemId);
    
    // Get batches with expiry warnings
    const warningBatches = await getBatchesWithExpiryWarnings(daysThreshold);

    return successResponse({
      updateResult,
      expiryWarnings: {
        count: warningBatches.length,
        batches: warningBatches
      },
      message: updateResult.success 
        ? `Successfully processed batch expiry check. ${updateResult.updatedCount} batches updated.`
        : 'Failed to process batch expiry check'
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error in batch expiry check:", error);
    return errorResponse("Failed to check batch expiry", 500);
  }
}

// GET /api/admin/inventory/check-expiry - Get batches with expiry warnings
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const daysThreshold = parseInt(searchParams.get('days') || '30');

    const warningBatches = await getBatchesWithExpiryWarnings(daysThreshold);

    return successResponse({
      count: warningBatches.length,
      batches: warningBatches,
      threshold: daysThreshold,
      message: `Found ${warningBatches.length} batches expiring within ${daysThreshold} days`
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching expiry warnings:", error);
    return errorResponse("Failed to fetch expiry warnings", 500);
  }
}
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireEvery,
  errorResponse,
  successResponse,
} from "@/lib/auth-utils";
import {
  checkAndUpdateExpiredBatches,
  getBatchExpiryInfo,
} from "@/lib/batch-expiry-utils";

// GET /api/admin/inventory/[id]/batches
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEvery();

    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return errorResponse("Invalid item ID", 400);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // check & update expired batches with safety
    let expiryUpdateResult = null;
    try {
      expiryUpdateResult = await checkAndUpdateExpiredBatches(itemId);
    } catch (err) {
      console.error("Expiry update failed safely:", err);
    }

    if (expiryUpdateResult && expiryUpdateResult.updatedCount > 0) {
      console.log(
        `Updated ${expiryUpdateResult.updatedCount} expired batches for item ${itemId}`
      );
    }

    // Fetch item metadata first
    const item = await prisma.product.findUnique({
      where: { id: itemId },
      include: { category: true },
    });

    if (!item) {
      return errorResponse("Item not found", 404);
    }

    const whereClause: any = { itemId };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const batches = await prisma.productBatch.findMany({
      where: whereClause,
      include: {
        receivedItem: {
          include: {
            purchaseItem: {
              include: { item: true },
            },
          },
        },
        damageRecords: true,
      },
      orderBy: { expiryDate: "asc" },
    });

    console.log(`[BatchesAPI] Found ${batches.length} batches for item ${itemId} (Status Filter: ${statusFilter || 'None'})`);

    if (batches.length === 0) {
      return successResponse({
        item,
        batches: {
          active: [],
          inactive: [],
          soldOut: [],
          expired: [],
          all: [],
        },
        summary: {
          totalStock: 0,
          totalDamageQuantity: 0,
          activeBatchesCount: 0,
          inactiveBatchesCount: 0,
          soldOutBatchesCount: 0,
          expiredBatchesCount: 0,
        },
      });
    }

    const batchesWithDamage = batches.map((batch) => {
      let damageQuantity = 0;
      let damageDisplay = "0";

      try {
        const damageRecords = (batch as any).damageRecords || [];
        const stripDamage = damageRecords
          .filter((d: any) => d.damageType !== 'SINGLE_TABLET')
          .reduce((sum: number, d: any) => sum + (Number(d.quantity) || 0), 0);
        const tabletDamage = damageRecords
          .filter((d: any) => d.damageType === 'SINGLE_TABLET')
          .reduce((sum: number, d: any) => sum + (Number(d.quantity) || 0), 0);

        if (stripDamage > 0 && tabletDamage > 0) {
          damageDisplay = `${stripDamage} units + ${tabletDamage} tablets`;
        } else if (stripDamage > 0) {
          damageDisplay = `${stripDamage} ${stripDamage > 1 ? 'units' : 'unit'}`;
        } else if (tabletDamage > 0) {
          damageDisplay = `${tabletDamage} ${tabletDamage > 1 ? 'tablets' : 'tablet'}`;
        }
        damageQuantity = stripDamage + tabletDamage;
      } catch (err) {
        console.error("Error calculating damage for batch:", batch.id, err);
      }

      let expiryInfo: any = {
        isExpired: false,
        expiryDateFormatted: null,
        daysUntilExpiry: null,
        expiryStatus: 'UNKNOWN'
      };

      try {
        expiryInfo = getBatchExpiryInfo(batch);
      } catch (err) {
        console.error("Error getting expiry info for batch:", batch.id, err);
      }

      return {
        ...batch,
        damageQuantity: Number(damageQuantity) || 0,
        damageDisplay: String(damageDisplay),
        ...expiryInfo,
      };
    });

    const byStatus = (status: string) =>
      batchesWithDamage.filter((b) => b.status === status);

    return successResponse({
      item,
      batches: {
        active: byStatus("ACTIVE"),
        inactive: byStatus("INACTIVE"),
        soldOut: byStatus("SOLD_OUT"),
        expired: byStatus("EXPIRED"),
        all: batchesWithDamage,
      },
      summary: {
        totalStock: batchesWithDamage
          .filter((b) => ["ACTIVE", "INACTIVE"].includes(b.status))
          .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0),
        totalDamageQuantity: batchesWithDamage.reduce(
          (sum, b) => sum + (Number(b.damageQuantity) || 0),
          0
        ),
        activeBatchesCount: byStatus("ACTIVE").length,
        inactiveBatchesCount: byStatus("INACTIVE").length,
        soldOutBatchesCount: byStatus("SOLD_OUT").length,
        expiredBatchesCount: byStatus("EXPIRED").length,
      },
      _debugCount: batches.length,
      expiryUpdateResult,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
    }

    console.error("Error fetching item batches:", error);
    return errorResponse("Failed to fetch item batches", 500);
  }
}

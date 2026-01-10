import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdmin,
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
    await requireAdmin();

    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return errorResponse("Invalid item ID", 400);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // check & update expired batches
    const expiryUpdateResult =
      await checkAndUpdateExpiredBatches(itemId);

    if (expiryUpdateResult.updatedCount > 0) {
      console.log(
        `Updated ${expiryUpdateResult.updatedCount} expired batches for item ${itemId}`
      );
    }

    const whereClause: any = { itemId };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const batches = await prisma.productBatch.findMany({
      where: whereClause,
      include: {
        item: {
          include: { category: true },
        },
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

    if (batches.length === 0) {
      const item = await prisma.product.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      if (!item) {
        return errorResponse("Item not found", 404);
      }

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
      const damageQuantity =
        batch.damageRecords?.reduce(
          (sum, d) => sum + d.quantity,
          0
        ) || 0;

      const expiryInfo = getBatchExpiryInfo(batch);

      return {
        ...batch,
        damageQuantity,
        ...expiryInfo,
      };
    });

    const byStatus = (status: string) =>
      batchesWithDamage.filter((b) => b.status === status);

    return successResponse({
      item: batches[0]?.item || null,
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
          .reduce((sum, b) => sum + b.quantity, 0),
        totalDamageQuantity: batchesWithDamage.reduce(
          (sum, b) => sum + (b.damageQuantity || 0),
          0
        ),
        activeBatchesCount: byStatus("ACTIVE").length,
        inactiveBatchesCount: byStatus("INACTIVE").length,
        soldOutBatchesCount: byStatus("SOLD_OUT").length,
        expiredBatchesCount: byStatus("EXPIRED").length,
      },
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

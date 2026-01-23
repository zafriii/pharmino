import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/received-items/[purchaseOrderId]
// Get received items for a purchase order OR single received item by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ purchaseOrderId: string }> }
) {
  try {
    await requireAdmin();

    const { purchaseOrderId } = await params;

    // Check if numeric (single received item ID)
    const isNumericId = /^\d+$/.test(purchaseOrderId);

    if (isNumericId) {
      // Get single received item by ID
      const receivedItem = await prisma.receivedItem.findUnique({
        where: {
          id: parseInt(purchaseOrderId),
        },
        include: {
          purchaseItem: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
          batches: true,
        },
      });

      if (!receivedItem) {
        return errorResponse("Received item not found", 404);
      }

      return successResponse([receivedItem]);
    }

    // Get received items by purchase order ID
    const receivedItems = await prisma.receivedItem.findMany({
      where: {
        purchaseItem: {
          purchaseOrderId,
        },
      },
      include: {
        purchaseItem: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        batches: true,
      },
      orderBy: { receivedAt: "desc" },
    });

    // Filter items not fully converted to batches
    const availableForStockEntry = receivedItems.filter((receivedItem) => {
      const totalBatchQuantity = receivedItem.batches.reduce(
        (sum, batch) => sum + batch.quantity,
        0
      );
      return totalBatchQuantity < receivedItem.receivedQuantity;
    });

    return successResponse(availableForStockEntry);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }

    console.error("Error fetching received items:", error);
    return errorResponse("Failed to fetch received items", 500);
  }
}

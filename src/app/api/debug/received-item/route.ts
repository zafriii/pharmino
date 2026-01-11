import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/debug/received-item?poId=xxx&itemName=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId");
    const itemName = searchParams.get("itemName");

    if (!poId || !itemName) {
      return errorResponse("poId and itemName are required", 400);
    }

    const receivedItem = await prisma.receivedItem.findFirst({
      where: {
        purchaseItem: {
          purchaseOrder: {
            id: poId
          },
          item: {
            itemName: {
              contains: itemName,
              mode: 'insensitive'
            }
          }
        }
      },
      include: {
        purchaseItem: {
          include: {
            item: true,
            purchaseOrder: true
          }
        },
        batches: {
          include: {
            item: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!receivedItem) {
      return errorResponse("Received item not found", 404);
    }

    const totalBatchQuantity = receivedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const remainingQuantity = receivedItem.receivedQuantity - totalBatchQuantity;

    const debugInfo = {
      receivedItem: {
        id: receivedItem.id,
        receivedQuantity: receivedItem.receivedQuantity,
        receivedAt: receivedItem.receivedAt,
        itemName: receivedItem.purchaseItem.item.itemName,
        poId: receivedItem.purchaseItem.purchaseOrder.id
      },
      batches: receivedItem.batches.map(batch => ({
        id: batch.id,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        status: batch.status,
        createdAt: batch.createdAt,
        purchasePrice: batch.purchasePrice,
        sellingPrice: batch.sellingPrice
      })),
      calculation: {
        totalBatchQuantity,
        remainingQuantity,
        isFullyProcessed: remainingQuantity <= 0,
        canAddToInventory: remainingQuantity > 0
      }
    };

    return successResponse(debugInfo);
  } catch (error) {
    console.error("Debug API error:", error);
    return errorResponse("Failed to debug received item", 500);
  }
}
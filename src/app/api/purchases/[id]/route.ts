import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Schema validation 
const purchaseItemSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  supplier: z.string().min(1, "Supplier is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  puchasePrice: z.number().positive("Purchase price must be positive"),
});

const updatePurchaseSchema = z.object({
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

// GET /api/purchases - Single Purcahse Order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: purchaseOrderId } = await params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          include: {
            item: {
              include: { category: true }
            },
            receivedItems: true
          }
        }
      },
    });

    if (!purchaseOrder) {
      return errorResponse("Purchase order not found", 404);
    }

    return successResponse(purchaseOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Pharmacy access required", 403);
    }
    console.error("Error fetching purchase order:", error);
    return errorResponse("Failed to fetch purchase order", 500);
  }
}

// PUT /api/purchases - Update PO 
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: purchaseOrderId } = await params;
    const body = await request.json();

    const validatedData = updatePurchaseSchema.parse(body);

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true }
    });

    if (!existingOrder) return errorResponse("Purchase order not found", 404);
    if (existingOrder.status !== 'LISTED') return errorResponse("Cannot edit purchase order that has been ordered", 400);

    const itemIds = validatedData.items.map(item => item.itemId);
    const existingItems = await prisma.product.findMany({
      where: { id: { in: itemIds } }
    });

    if (existingItems.length !== itemIds.length) return errorResponse("One or more items not found", 404);

    const itemsWithTotal = validatedData.items.map(item => ({
      ...item,
      totalAmount: item.quantity * item.puchasePrice
    }));

    const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalAmount, 0);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseOrderId } });

      const updated = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          totalAmount,
          items: {
            create: itemsWithTotal
          }
        },
        include: {
          items: {
            include: {
              item: { include: { category: true } },
              receivedItems: true
            }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PURCHASE_ORDER",
          entity: "PurchaseOrder",
          entityId: updated.id,
          details: { totalAmount: updated.totalAmount, itemCount: itemsWithTotal.length },
        }
      });

      return updated;
    });

    return successResponse(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0].message, 400);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Pharmacy access required", 403);
    }
    console.error("Error updating purchase order:", error);
    return errorResponse("Failed to update purchase order", 500);
  }
}

//  DELETE  /api/purchases - Delete PO
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id: purchaseOrderId } = await params;

    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId }
    });

    if (!existingOrder) return errorResponse("Purchase order not found", 404);
    if (existingOrder.status !== 'LISTED') return errorResponse("Cannot delete purchase order that has been ordered", 400);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.delete({ where: { id: purchaseOrderId } });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PURCHASE_ORDER",
          entity: "PurchaseOrder",
          entityId: purchaseOrderId,
          details: { totalAmount: existingOrder.totalAmount }
        }
      });
    });

    return successResponse({ message: "Purchase order deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Pharmacy access required", 403);
    }
    console.error("Error deleting purchase order:", error);
    return errorResponse("Failed to delete purchase order", 500);
  }
}

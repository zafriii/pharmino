import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Schema validation
const updateStatusSchema = z.object({
  status: z.enum(["LISTED", "ORDERED", "RECEIVED"]).refine(
    (val) => ["LISTED", "ORDERED", "RECEIVED"].includes(val),
    { message: "Status must be LISTED, ORDERED, or RECEIVED" }
  ),
});

// PATCH /api/purchases/[id]/status - Update status from LISTED to ORDERED/RECEIVED

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const user = await requireAdmin();

    const { id: purchaseOrderId } = await params;

    const body = await request.json();
    const { status: newStatus } = updateStatusSchema.parse(body);

    // Fetch existing order
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: { include: { item: true } },
      },
    });

    if (!existingOrder) {
      return errorResponse("Purchase order not found", 404);
    }

    const currentStatus = existingOrder.status;

    // Status transition rules
    const validTransitions: Record<string, string[]> = {
      LISTED: ["ORDERED"],
      ORDERED: ["RECEIVED"],
      RECEIVED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return errorResponse(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    // Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update purchase order status
      const updated = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: newStatus },
        include: { items: { include: { item: true } } },
      });

      // Update purchase items status
      await tx.purchaseItem.updateMany({
        where: { purchaseOrderId },
        data: { status: newStatus },
      });

      // If RECEIVED → insert into ReceivedItem only (inventory will be updated when adding to inventory via batches)
      if (newStatus === "RECEIVED") {
        for (const item of updated.items) {
          await tx.receivedItem.create({
            data: {
              purchaseItemId: item.id,
              receivedQuantity: item.quantity,
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PURCHASE_ORDER_STATUS",
          entity: "PurchaseOrder",
          entityId: updated.id,
          details: { oldStatus: currentStatus, newStatus },
        },
      });

      return updated;
    });

    return successResponse(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Pharmacy access required", 403);
    }

    console.error("Error updating purchase order status:", error);
    return errorResponse("Failed to update purchase order status", 500);
  }
}

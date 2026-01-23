import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import {
  requireEvery,
  errorResponse,
  successResponse,
} from "@/lib/auth-utils";

// PATCH /api/admin/batches/[id] - Update batch expiry date and status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEvery();

    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return errorResponse("Invalid batch ID", 400);
    }

    const body = await request.json();
    const { expiryDate, status } = body;

    // Validate status if provided
    if (status && !['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'EXPIRED'].includes(status)) {
      return errorResponse("Invalid status. Must be ACTIVE, INACTIVE, SOLD_OUT, or EXPIRED", 400);
    }

    // Check if batch exists
    const existingBatch = await prisma.productBatch.findUnique({
      where: { id: batchId },
      include: {
        item: {
          select: { id: true, itemName: true }
        }
      }
    });

    if (!existingBatch) {
      return errorResponse("Batch not found", 404);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }

    // Update the batch
    const updatedBatch = await prisma.productBatch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        item: {
          select: { id: true, itemName: true }
        }
      }
    });

    // Revalidate the batches cache
    // revalidateTag("batches");
    // revalidateTag(`item-${existingBatch.itemId}`);

    return successResponse({
      batch: updatedBatch,
      message: `Batch ${existingBatch.batchNumber} updated successfully`
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
    }

    console.error("Error updating batch:", error);
    return errorResponse("Failed to update batch", 500);
  }
}

// GET /api/admin/batches/[id] - Get single batch details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEvery();

    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return errorResponse("Invalid batch ID", 400);
    }

    const batch = await prisma.productBatch.findUnique({
      where: { id: batchId },
      include: {
        item: {
          include: { category: true }
        },
        receivedItem: {
          include: {
            purchaseItem: {
              include: { item: true }
            }
          }
        },
        damageRecords: true,
      }
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    // Calculate damage quantity
    const damageQuantity = batch.damageRecords?.reduce(
      (sum, d) => sum + d.quantity,
      0
    ) || 0;

    return successResponse({
      batch: {
        ...batch,
        damageQuantity
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
    }

    console.error("Error fetching batch:", error);
    return errorResponse("Failed to fetch batch", 500);
  }
}
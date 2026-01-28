import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";
import { calculateStripImpact } from "@/lib/tablet-calculation.utils";
import { z } from "zod";

const damageSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  batchId: z.number().int().positive("Batch ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  damageType: z.enum(['FULL_STRIP', 'SINGLE_TABLET', 'ML']).default('FULL_STRIP'),
  reason: z.string().min(1, "Reason is required")
});

// GET /api/damage - Get all damage records
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const itemId = searchParams.get('itemId');
    const batchId = searchParams.get('batchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (itemId) where.itemId = parseInt(itemId);
    if (batchId) where.batchId = parseInt(batchId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const total = await prisma.damage.count({ where });

    const damages = await prisma.damage.findMany({
      where,
      include: {
        item: {
          select: { id: true, itemName: true, genericName: true, brand: true, imageUrl: true }
        },
        batch: {
          select: { id: true, batchNumber: true, expiryDate: true, supplier: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse({
      damages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
    console.error("Error fetching damage records:", error);
    return errorResponse("Failed to fetch damage records", 500);
  }
}

// POST /api/damage - Record damage/loss
export async function POST(request: NextRequest) {
  try {
    const user = await requireEvery();
    const body = await request.json();

    const validatedData = damageSchema.parse(body);

    // Validate item exists
    const item = await prisma.product.findUnique({
      where: { id: validatedData.itemId }
    });

    if (!item) {
      return errorResponse("Item not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validate batch exists and has sufficient quantity inside transaction
      const batch = await tx.productBatch.findUnique({
        where: { id: validatedData.batchId }
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      if (batch.itemId !== validatedData.itemId) {
        throw new Error("Batch does not belong to the specified item");
      }

      if (validatedData.damageType === 'SINGLE_TABLET' && item.tabletsPerStrip) {
        const totalTabletsInBatch = (batch.quantity * item.tabletsPerStrip) + (batch.remainingTablets || 0);
        if (totalTabletsInBatch < validatedData.quantity) {
          throw new Error(`Insufficient tablets in batch. Available: ${totalTabletsInBatch}, Required: ${validatedData.quantity}`);
        }
      } else if (batch.quantity < validatedData.quantity) {
        throw new Error(`Insufficient quantity in batch. Available: ${batch.quantity}, Required: ${validatedData.quantity}`);
      }
      // Create damage record
      const damage = await tx.damage.create({
        data: {
          itemId: validatedData.itemId,
          batchId: validatedData.batchId,
          quantity: validatedData.quantity,
          damageType: validatedData.damageType,
          reason: validatedData.reason,
          createdBy: user.id
        },
        include: {
          item: {
            select: { id: true, itemName: true, genericName: true, brand: true, imageUrl: true }
          },
          batch: {
            select: { id: true, batchNumber: true, expiryDate: true, supplier: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Update batch quantity and tablets
      let newBatchQuantity = batch.quantity;
      let newRemainingTablets = batch.remainingTablets;

      if (validatedData.damageType === 'SINGLE_TABLET' && item.tabletsPerStrip) {
        const totalTablets = (batch.quantity * item.tabletsPerStrip) + (batch.remainingTablets || 0) - validatedData.quantity;
        newBatchQuantity = Math.floor(totalTablets / item.tabletsPerStrip);
        const remainder = totalTablets % item.tabletsPerStrip;
        newRemainingTablets = remainder > 0 ? remainder : null;
      } else {
        newBatchQuantity = batch.quantity - validatedData.quantity;
      }

      await tx.productBatch.update({
        where: { id: validatedData.batchId },
        data: {
          quantity: newBatchQuantity,
          remainingTablets: newRemainingTablets,
          status: (newBatchQuantity === 0 && !newRemainingTablets) ? 'SOLD_OUT' : batch.status
        }
      });

      // If this batch is now sold out and it was active, activate the next batch
      if (newBatchQuantity === 0 && batch.status === 'ACTIVE') {
        const nextInactiveBatch = await tx.productBatch.findFirst({
          where: {
            itemId: validatedData.itemId,
            status: 'INACTIVE',
            quantity: { gt: 0 }
          },
          orderBy: [
            { expiryDate: 'asc' },
            { createdAt: 'asc' }
          ]
        });

        if (nextInactiveBatch) {
          await tx.productBatch.update({
            where: { id: nextInactiveBatch.id },
            data: { status: 'ACTIVE' }
          });
        }
      }

      // Update inventory record
      const inventory = await tx.inventory.findUnique({
        where: { productId: validatedData.itemId }
      });

      if (inventory) {
        let stripsToDeduct = 0;
        if (validatedData.damageType === 'SINGLE_TABLET' && item.tabletsPerStrip) {
          // Calculate how many FULL strips are gone from inventory
          // Total tablets before - Total tablets after
          const totalBefore = (batch.quantity * item.tabletsPerStrip) + (batch.remainingTablets || 0);
          const totalAfter = (newBatchQuantity * item.tabletsPerStrip) + (newRemainingTablets || 0);

          // The quantity of strips to deduct from inventory is (Initial Strips - Current Strips)
          stripsToDeduct = batch.quantity - newBatchQuantity;
        } else {
          stripsToDeduct = validatedData.quantity;
        }

        const newTotalQuantity = inventory.totalQuantity - stripsToDeduct;
        const newAvailableQuantity = inventory.availableQuantity - stripsToDeduct;

        let newStatus = inventory.status;
        if (newTotalQuantity === 0) {
          newStatus = 'OUT_OF_STOCK';
        } else if (newTotalQuantity < inventory.lowStockThreshold) {
          newStatus = 'LOW_STOCK';
        } else {
          newStatus = 'IN_STOCK';
        }

        await tx.inventory.update({
          where: { productId: validatedData.itemId },
          data: {
            totalQuantity: newTotalQuantity,
            availableQuantity: newAvailableQuantity,
            status: newStatus,
            lastUpdated: new Date()
          }
        });
      }

      // Log the action
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "RECORD_DAMAGE",
          entity: "Damage",
          entityId: damage.id.toString(),
          details: {
            itemName: item.itemName,
            batchNumber: batch.batchNumber,
            quantity: validatedData.quantity,
            reason: validatedData.reason
          },
        },
      });

      return damage;
    }, {
      timeout: 10000, // 10 second timeout
    });

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
      if (error.message.includes("not found")) {
        return errorResponse(error.message, 404);
      }
      if (error.message.includes("Insufficient quantity") || error.message.includes("does not belong")) {
        return errorResponse(error.message, 400);
      }
      // Handle Prisma transaction errors
      if (error.message.includes("Transaction") || error.message.includes("transaction")) {
        console.error("Transaction error:", error);
        return errorResponse("Database transaction failed. Please try again.", 500);
      }
    }
    console.error("Error recording damage:", error);
    return errorResponse("Failed to record damage", 500);
  }
}
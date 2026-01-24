import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

const stockEntrySchema = z.object({
  receivedItemId: z.number().int().positive().optional().nullable(),
  itemId: z.number().int().positive("Item ID is required"),
  expiryDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  quantity: z.number().int().positive("Quantity must be positive"),
  supplier: z.string().min(1, "Supplier is required"),
});

// GET /api/stock-entry - Get received items ready for stock entry
export async function GET(_request: NextRequest) {
  try {
    await requireEvery();

    const receivedItems = await prisma.receivedItem.findMany({
      include: {
        purchaseItem: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        batches: true
      },
      orderBy: { receivedAt: 'desc' }
    });

    // Filter items that haven't been fully converted to batches
    const availableForStockEntry = receivedItems.filter(receivedItem => {
      const totalBatchQuantity = receivedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
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

// POST /api/admin/stock-entry - Create stock entry (batch) and update inventory

export async function POST(request: NextRequest) {
  try {
    const user = await requireEvery();
    const body = await request.json();
    const validatedData = stockEntrySchema.parse(body);

    // Check product
    const item = await prisma.product.findUnique({
      where: { id: validatedData.itemId },
    });

    if (!item) {
      return errorResponse("Item not found", 404);
    }

    //  Check received item remaining quantity
    if (validatedData.receivedItemId) {
      const receivedItem = await prisma.receivedItem.findUnique({
        where: { id: validatedData.receivedItemId },
        include: { batches: true },
      });

      if (!receivedItem) {
        return errorResponse("Received item not found", 404);
      }

      const usedQty = receivedItem.batches.reduce(
        (sum, b) => sum + b.quantity,
        0
      );

      const remainingQty = receivedItem.receivedQuantity - usedQty;

      if (validatedData.quantity > remainingQty) {
        return errorResponse(
          `Quantity exceeds remaining received quantity (${remainingQty})`,
          400
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      //  Inventory create / update
      let inventory = await tx.inventory.findUnique({
        where: { productId: validatedData.itemId },
      });

      if (inventory) {
        inventory = await tx.inventory.update({
          where: { productId: validatedData.itemId },
          data: {
            totalQuantity: inventory.totalQuantity + validatedData.quantity,
            availableQuantity:
              inventory.availableQuantity + validatedData.quantity,
            lastUpdated: new Date(),
            status:
              inventory.totalQuantity + validatedData.quantity >=
              item.lowStockThreshold
                ? "IN_STOCK"
                : "LOW_STOCK",
          },
        });
      } else {
        inventory = await tx.inventory.create({
          data: {
            productId: validatedData.itemId,
            totalQuantity: validatedData.quantity,
            availableQuantity: validatedData.quantity,
            reservedQuantity: 0,
            lowStockThreshold: item.lowStockThreshold,
            status:
              validatedData.quantity >= item.lowStockThreshold
                ? "IN_STOCK"
                : "LOW_STOCK",
          },
        });
      }

      //  Check if first active batch
      const hasActiveBatch = await tx.productBatch.findFirst({
        where: {
          itemId: validatedData.itemId,
          status: "ACTIVE",
        },
      });

      //  SAFE batch number generation (FIXED BUG)
      const prefix = item.itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 4);

      let batch = null;
      let attempt = 0;

      while (!batch && attempt < 5) {
        attempt++;

        const lastBatch = await tx.productBatch.findFirst({
          where: {
            batchNumber: { startsWith: `${prefix}-` },
          },
          orderBy: { createdAt: "desc" },
          select: { batchNumber: true },
        });

        const lastNumber = lastBatch
          ? parseInt(lastBatch.batchNumber.split("-").pop() || "0", 10)
          : 0;

        const batchNumber = `${prefix}-${String(lastNumber + 1).padStart(
          3,
          "0"
        )}`;

        try {
          batch = await tx.productBatch.create({
            data: {
              itemId: validatedData.itemId,
              inventoryId: inventory.id,
              receivedItemId: validatedData.receivedItemId,
              batchNumber,
              expiryDate: validatedData.expiryDate,
              purchasePrice: validatedData.purchasePrice,
              sellingPrice: validatedData.sellingPrice,
              quantity: validatedData.quantity,
              supplier: validatedData.supplier,
              status: hasActiveBatch ? "INACTIVE" : "ACTIVE",
            },
            include: {
              item: {
                include: { category: true },
              },
            },
          });
        } catch (err: any) {
          // retry only on duplicate batch number
          if (err.code !== "P2002") throw err;
        }
      }

      if (!batch) {
        throw new Error("Failed to generate unique batch number");
      }

      //  Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_STOCK_ENTRY",
          entity: "ProductBatch",
          entityId: batch.id.toString(),
          details: {
            itemName: item.itemName,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            status: batch.status,
          },
        },
      });

      return batch;
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
    }

    console.error("Stock entry error:", error);
    return errorResponse("Failed to create stock entry", 500);
  }
}
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/received-items - Get all received order prodcucts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get('search');

    const where: any = {};
    
    if (search) {
      where.purchaseItem = {
        item: {
          OR: [
            { itemName: { contains: search, mode: 'insensitive' } },
            { genericName: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const total = await prisma.receivedItem.count({ where });

    if (total === 0) {
      return successResponse({
        receivedItems: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const receivedItems = await prisma.receivedItem.findMany({
      where,
      include: {
        purchaseItem: {
          include: {
            item: {
              include: {
                category: true
              }
            },
            purchaseOrder: true
          }
        },
        batches: true
      },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter items that haven't been fully converted to batches and add status
    const itemsWithStatus = receivedItems.map(receivedItem => {
      const totalBatchQuantity = receivedItem.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const remainingQuantity = receivedItem.receivedQuantity - totalBatchQuantity;
      
      return {
        ...receivedItem,
        remainingQuantity,
        isFullyProcessed: remainingQuantity <= 0,
        canAddToInventory: remainingQuantity > 0
      };
    });

    return successResponse({
      receivedItems: itemsWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in received-items API:", error);
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
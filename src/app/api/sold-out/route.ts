import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/pharmacy-sold-out - Get all sold-out and expired batches
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {
      OR: [
        { status: 'SOLD_OUT' },
        { status: 'EXPIRED' }
      ]
    };

    if (itemId) {
      where.itemId = parseInt(itemId);
    }

    const total = await prisma.productBatch.count({ where });

    const soldOutBatches = await prisma.productBatch.findMany({
      where,
      include: {
        item: {
          include: {
            category: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Group by item for better organization
    const groupedByItem = soldOutBatches.reduce((acc, batch) => {
      const itemId = batch.item.id;
      if (!acc[itemId]) {
        acc[itemId] = {
          item: batch.item,
          batches: []
        };
      }
      acc[itemId].batches.push(batch);
      return acc;
    }, {} as Record<number, any>);

    return successResponse({
      soldOutBatches,
      groupedByItem: Object.values(groupedByItem),
      summary: {
        totalSoldOutBatches: soldOutBatches.filter(b => b.status === 'SOLD_OUT').length,
        totalExpiredBatches: soldOutBatches.filter(b => b.status === 'EXPIRED').length,
        totalItems: Object.keys(groupedByItem).length
      },
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
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
    }
    console.error("Error fetching sold-out batches:", error);
    return errorResponse("Failed to fetch sold-out batches", 500);
  }
}
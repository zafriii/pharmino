import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Validation Schema
const purchaseItemSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  supplier: z.string().min(1, "Supplier is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  puchasePrice: z.number().positive("Purchase price must be positive"),
});

const createPurchaseSchema = z.object({
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

// GET /api/purchases - Get all purchase orders
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { items: { some: { supplier: { contains: search, mode: 'insensitive' } } } },
        { items: { some: { item: { itemName: { contains: search, mode: 'insensitive' } } } } }
      ];
    }

    // Get stats for all filtered purchases (not paginated)
    const [
      totalOrders,
      totalAmount,
      listedOrders,
      totalItems
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where }).then(res => res._sum.totalAmount || 0),
      prisma.purchaseOrder.count({ where: { ...where, status: "LISTED" } }),
      prisma.purchaseOrder.findMany({ where, include: { items: true } }).then(orders => orders.reduce((sum, order) => sum + (order.items?.length || 0), 0))
    ]);

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: {
          include: {
            item: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse({
      items: purchaseOrders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
      stats: {
        totalOrders,
        totalAmount,
        listedOrders,
        totalItems
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Pharmacy access required", 403);
    }
    console.error("Error fetching purchase orders:", error);
    return errorResponse("Failed to fetch purchase orders", 500);
  }
}

// POST /api/purchases - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const validatedData = createPurchaseSchema.parse(body);

    // Verify all items exist
    const itemIds = validatedData.items.map(item => item.itemId);
    const existingItems = await prisma.product.findMany({ where: { id: { in: itemIds } } });
    if (existingItems.length !== itemIds.length) return errorResponse("One or more items not found", 404);

    // Calculate total amount per item
    const itemsWithTotal = validatedData.items.map(item => ({
      ...item,
      totalAmount: item.quantity * item.puchasePrice
    }));

    const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalAmount, 0);

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.purchaseOrder.create({
        data: {
          totalAmount,
          items: {
            create: itemsWithTotal
          }
        },
        include: {
          items: {
            include: {
              item: {
                include: { category: true }
              }
            }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PURCHASE_ORDER",
          entity: "PurchaseOrder",
          entityId: newOrder.id,
          details: { totalAmount: newOrder.totalAmount, itemCount: itemsWithTotal.length },
        }
      });

      return newOrder;
    });

    return successResponse(purchaseOrder, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0].message, 400);
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Pharmacy access required", 403);
    }
    console.error("Error creating purchase order:", error);
    return errorResponse("Failed to create purchase order", 500);
  }
}

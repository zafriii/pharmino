import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Schema validation
// const productSchema = z.object({

//   categoryId: z.number().int().positive("Category ID is required"),
//   itemName: z.string().min(1, "Item name is required"),

//   imageUrl: z.string().url().nullable().optional(),
//   genericName: z.string().nullable().optional(),
//   brand: z.string().nullable().optional(),
//   strength: z.string().nullable().optional(), 

//   tabletsPerStrip: z.number().int().positive().nullable().optional(), 
//   // baseUnit: z.string().nullable().optional(), 
//   baseUnit: z.string().min(1, "Base Unit is required"),
//   rackLocation: z.string().nullable().optional(),

//   lowStockThreshold: z.number().int().min(0).default(0),

//   pricePerUnit: z.number().positive().nullable().optional(), 
//   sellingPrice: z.number().positive("Selling price must be positive"),
//   status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),

// });

const productSchema = z.object({
  categoryId: z.number().int().positive("Category ID is required"),
  itemName: z.string().min(1, "Item name is required"),
  imageUrl: z.string().url().optional().nullable(),
  genericName: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  tabletsPerStrip: z.number().int().positive().optional().nullable(),
  unitPerBox: z.number().int().positive().optional().nullable(),
  baseUnit: z.string().min(1, "Base Unit is required"),
  rackLocation: z.string().optional().nullable(),
  lowStockThreshold: z.number().int().min(0).default(0),
  pricePerUnit: z.number().positive().optional().nullable(),
  sellingPrice: z.number().positive("Selling price must be positive"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});



// GET /api/admin/products - Get products (simplified)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const brand = searchParams.get("brand");

    const where: any = {};
    if (categoryId) where.categoryId = Number(categoryId);
    if (status) where.status = status;
    if (brand) where.brand = { equals: brand, mode: "insensitive" };

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    // Total count for pagination
    const total = await prisma.product.count({ where });

    // Fetch products with category and batch information for sale
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        batches: {
          where: {
            status: {
              in: ["ACTIVE", "INACTIVE", "EXPIRED"]
            },
            AND: [
              {
                OR: [
                  { quantity: { gt: 0 } }, // Batches with complete strips
                  { remainingTablets: { gt: 0 } } // Batches with partial tablets
                ]
              }
            ]
          },
          orderBy: [
            { expiryDate: "asc" },
            { createdAt: "asc" }
          ]
        }
      },
      orderBy: { itemName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate total stock and stock status for each product
    const productsWithStock = products.map(product => {
      let totalStock = 0;
      let totalTablets = 0;

      // Only count ACTIVE and INACTIVE batches for stock calculation (exclude EXPIRED)
      const availableBatches = product.batches.filter(batch => batch.status !== 'EXPIRED');

      if (product.tabletsPerStrip) {
        // For tablet products, calculate both strips and tablets
        totalStock = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        totalTablets = availableBatches.reduce((sum, batch) => {
          const completeStripTablets = batch.quantity * product.tabletsPerStrip!;
          const partialTablets = batch.remainingTablets || 0;
          return sum + completeStripTablets + partialTablets;
        }, 0);
      } else {
        // For non-tablet products, use regular calculation
        totalStock = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      }

      const stockForThreshold = product.tabletsPerStrip ? totalTablets / product.tabletsPerStrip : totalStock;
      const stockStatus = totalTablets === 0 && totalStock === 0 ? "OUT_OF_STOCK" :
        stockForThreshold <= product.lowStockThreshold ? "LOW_STOCK" : "IN_STOCK";

      return {
        ...product,
        totalStock: product.tabletsPerStrip ? totalTablets : totalStock, // Show tablets for tablet products
        stockStatus,
        batches: product.batches.map(batch => ({
          id: batch.id,
          quantity: batch.quantity,
          remainingTablets: batch.remainingTablets,
          expiryDate: batch.expiryDate,
          status: batch.status
        }))
      };
    });
    return successResponse({
      items: productsWithStock,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error(error);
    return errorResponse("Failed to fetch products", 500);
  }
}

// POST /api/admin/products/ - Create Product 
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const data = productSchema.parse(body);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) return errorResponse("Category not found", 404);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: data as any,
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: created.id.toString(),
          details: {
            itemName: created.itemName,
            pricePerUnit: created.pricePerUnit,
            sellingPrice: created.sellingPrice,
          },
        },
      });

      return created;
    });

    return successResponse(product, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error(error);
    return errorResponse("Failed to create product", 500);
  }
}

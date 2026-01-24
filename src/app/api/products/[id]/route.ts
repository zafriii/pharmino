import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Schema validation


const updateProductSchema = z.object({
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


// GET  /api/products/[id] - Single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) return errorResponse("Invalid product ID", 400);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, batches: { orderBy: { expiryDate: "asc" } } },
    });

    if (!product) return errorResponse("Product not found", 404);

    const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
    const stockStatus =
      totalStock > 0
        ? totalStock >= product.lowStockThreshold
          ? "IN_STOCK"
          : "LOW_STOCK"
        : "OUT_OF_STOCK";

    return successResponse({ ...product, totalStock, stockStatus });
  } catch (error) {
    console.error(error);
    return errorResponse("Failed to fetch product", 500);
  }
}

// PUT  /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) return errorResponse("Invalid product ID", 400);

    const body = await request.json();

    // sanitize numeric fields to avoid NaN errors
    const sanitizedBody = {
      ...body,
      pricePerUnit:
        body.pricePerUnit === "" || body.pricePerUnit === null
          ? null
          : Number(body.pricePerUnit),
      sellingPrice:
        body.sellingPrice === "" || body.sellingPrice === null
          ? null
          : Number(body.sellingPrice),
      tabletsPerStrip:
        body.tabletsPerStrip === "" || body.tabletsPerStrip === null
          ? null
          : Number(body.tabletsPerStrip),
      unitPerBox:
        body.unitPerBox === "" || body.unitPerBox === null
          ? null
          : Number(body.unitPerBox),
      lowStockThreshold:
        body.lowStockThreshold === "" || body.lowStockThreshold === null
          ? undefined
          : Number(body.lowStockThreshold),
    };

    const data = updateProductSchema.parse(sanitizedBody);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return errorResponse("Product not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: data as any,
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PRODUCT",
          entity: "Product",
          entityId: product.id.toString(),
          details: data,
        },
      });

      return product;
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return errorResponse(error instanceof z.ZodError ? error.issues[0].message : "Failed to update product", 500);
  }
}

// DELETE  /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) return errorResponse("Invalid product ID", 400);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { batches: true, saleItems: true },
    });

    if (!product) return errorResponse("Product not found", 404);
    if (product.batches.length || product.saleItems.length)
      return errorResponse("Cannot delete product with batches or sales", 400);

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: productId } });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PRODUCT",
          entity: "Product",
          entityId: productId.toString(),
          details: { itemName: product.itemName },
        },
      });
    });

    return successResponse({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return errorResponse("Failed to delete product", 500);
  }
}

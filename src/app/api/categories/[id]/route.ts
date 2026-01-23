import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdmin,
  errorResponse,
  successResponse,
} from "@/lib/auth-utils";
import { z } from "zod";

/* SCHEMA*/
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

/* GET */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId))
      return errorResponse("Invalid category ID", 400);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { items: true } } },
    });

    if (!category) return errorResponse("Category not found", 404);

    return successResponse({
      ...category,
      itemCount: category._count.items,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
    }
    return errorResponse("Failed to fetch category", 500);
  }
}

/*  PUT  */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId))
      return errorResponse("Invalid category ID", 400);

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const category = await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id: categoryId },
        data: validatedData,
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "UPDATE_CATEGORY",
          entity: "Category",
          entityId: updated.id.toString(),
          details: validatedData,
        },
      });

      return updated;
    });

    return successResponse(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
    }
    return errorResponse("Failed to update category", 500);
  }
}

/*  DELETE  */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId))
      return errorResponse("Invalid category ID", 400);

    const { searchParams } = new URL(request.url);
    const transferToIdParam = searchParams.get("transferToId");
    const transferToId = transferToIdParam
      ? parseInt(transferToIdParam)
      : null;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { items: true } } },
    });

    if (!category) return errorResponse("Category not found", 404);

    const itemCount = category._count.items;

    await prisma.$transaction(async (tx) => {
      if (itemCount > 0) {
        if (!transferToId)
          throw new Error(
            `Category has ${itemCount} items. Provide transferToId.`
          );

        if (transferToId === categoryId)
          throw new Error("Cannot transfer to same category");

        const target = await tx.category.findUnique({
          where: { id: transferToId },
        });

        if (!target)
          throw new Error("Target category not found");

        await tx.product.updateMany({
          where: { categoryId },
          data: { categoryId: transferToId },
        });
      }

      await tx.category.delete({
        where: { id: categoryId },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "DELETE_CATEGORY",
          entity: "Category",
          entityId: categoryId.toString(),
          details: {
            name: category.name,
            itemsTransferred: itemCount > 0,
            transferredTo: transferToId,
          },
        },
      });
    });

    return successResponse({ message: "Category deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden"))
        return errorResponse("Forbidden - Admin access required", 403);
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to delete category", 500);
  }
}

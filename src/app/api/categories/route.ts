import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

// Schema validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

// GET /api/categories - Get all categories
export async function GET() {
  try {
    await requireAdmin();

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
      itemCount: cat._count.items,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return successResponse(formattedCategories);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching categories:", error);
    return errorResponse("Failed to fetch categories", 500);
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    
    const validatedData = categorySchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return errorResponse("Category with this name already exists", 409);
    }

    const category = await prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: validatedData.name,
          imageUrl: validatedData.imageUrl,
          sortOrder: validatedData.sortOrder,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CREATE_CATEGORY",
          entity: "Category",
          entityId: newCategory.id.toString(),
          details: { name: newCategory.name },
        },
      });

      return newCategory;
    });

    return successResponse(category, 201);
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
    console.error("Error creating category:", error);
    return errorResponse("Failed to create category", 500);
  }
}

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

const returnSchema = z.object({
  returnReason: z.string().min(1, "Return reason is required"),
});

// PUT /api/admin/sales/[id]/return - Process return for a sale (WITHOUT inventory restoration)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    
    const validatedData = returnSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get the sale
      const sale = await tx.sale.findUnique({
        where: { id: parseInt(id) },
        include: {
          saleItems: {
            include: {
              item: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status === 'RETURNED') {
        throw new Error('Sale already returned');
      }

      // Update sale status (NO inventory restoration here)
      const updatedSale = await tx.sale.update({
        where: { id: parseInt(id) },
        data: {
          status: 'RETURNED',
          paymentStatus: 'REFUNDED',
          returnReason: validatedData.returnReason
        }
      });

      // Log the action
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "RETURN_SALE",
          entity: "PharmacySale",
          entityId: id,
          details: { 
            grandTotal: sale.grandTotal,
            returnReason: validatedData.returnReason
          },
        },
      });

      return updatedSale;
    });

    // Fetch the complete updated sale
    const completeSale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        saleItems: {
          include: {
            item: {
              include: {
                category: true
              }
            },
            batches: {
              include: {
                batch: true
              }
            }
          }
        }
      }
    });

    return successResponse(completeSale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
      if (error.message.includes("not found") || error.message.includes("already returned")) {
        return errorResponse(error.message, 400);
      }
    }
    console.error("Error processing return:", error);
    return errorResponse("Failed to process return", 500);
  }
}
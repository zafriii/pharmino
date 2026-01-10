// import { NextRequest } from "next/server";
// import prisma from "@/lib/prisma";
// import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// // PUT /api/admin/sales/[id]/back-to-inventory - Restore returned sale items back to inventory
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const user = await requireAdmin();

//     const result = await prisma.$transaction(async (tx) => {
//       // Get the sale with all its items and batch mappings
//       const sale = await tx.sale.findUnique({
//         where: { id: parseInt(params.id) },
//         include: {
//           saleItems: {
//             include: {
//               batches: {
//                 include: {
//                   batch: true
//                 }
//               }
//             }
//           }
//         }
//       });

//       if (!sale) {
//         throw new Error('Sale not found');
//       }

//       if (sale.status !== 'RETURNED') {
//         throw new Error('Sale must be returned before restoring to inventory');
//       }

//       // Check if already restored to inventory
//       const existingLog = await tx.auditLog.findFirst({
//         where: {
//           action: "RESTORE_TO_INVENTORY",
//           entity: "PharmacySale",
//           entityId: params.id
//         }
//       });

//       if (existingLog) {
//         throw new Error('Sale items already restored to inventory');
//       }

//       // Return stock to batches
//       for (const saleItem of sale.saleItems) {
//         for (const saleBatch of saleItem.batches) {
//           // Check if batch still exists and is not expired
//           const currentBatch = await tx.productBatch.findUnique({
//             where: { id: saleBatch.batchId }
//           });

//           if (!currentBatch) {
//             throw new Error(`Batch ${saleBatch.batchId} no longer exists`);
//           }

//           // Check if batch is expired
//           const now = new Date();
//           const isExpired = currentBatch.expiryDate < now;

//           // Add quantity back to the batch
//           await tx.productBatch.update({
//             where: { id: saleBatch.batchId },
//             data: {
//               quantity: {
//                 increment: saleBatch.quantity
//               },
//               // If batch was SOLD_OUT and not expired, make it ACTIVE again
//               status: currentBatch.status === 'SOLD_OUT' && !isExpired ? 'ACTIVE' : 
//                       isExpired ? 'EXPIRED' : currentBatch.status
//             }
//           });
//         }
//       }

//       // Log the inventory restoration action
//       await tx.auditLog.create({
//         data: {
//           userId: user.id,
//           action: "RESTORE_TO_INVENTORY",
//           entity: "PharmacySale",
//           entityId: params.id,
//           details: { 
//             saleId: sale.id,
//             grandTotal: sale.grandTotal,
//             itemsCount: sale.saleItems.length
//           },
//         },
//       });

//       return sale;
//     });

//     // Fetch the complete updated sale
//     const completeSale = await prisma.sale.findUnique({
//       where: { id: parseInt(params.id) },
//       include: {
//         customer: true,
//         creator: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         },
//         saleItems: {
//           include: {
//             item: {
//               include: {
//                 category: true
//               }
//             },
//             batches: {
//               include: {
//                 batch: true
//               }
//             }
//           }
//         }
//       }
//     });

//     return successResponse(completeSale);
//   } catch (error) {
//     if (error instanceof Error) {
//       if (error.message === "Unauthorized") {
//         return errorResponse("Unauthorized", 401);
//       }
//       if (error.message.includes("Forbidden")) {
//         return errorResponse("Forbidden - Pharmacy access required", 403);
//       }
//       if (error.message.includes("not found") || 
//           error.message.includes("must be returned") ||
//           error.message.includes("already restored") ||
//           error.message.includes("no longer exists")) {
//         return errorResponse(error.message, 400);
//       }
//     }
//     console.error("Error restoring to inventory:", error);
//     return errorResponse("Failed to restore items to inventory", 500);
//   }
// }








import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// PUT /api/admin/sales/[id]/back-to-inventory
// Restore returned sale items back to inventory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const saleId = parseInt(id);

    if (isNaN(saleId)) {
      return errorResponse("Invalid sale ID", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the sale with all its items and batch mappings
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          saleItems: {
            include: {
              batches: {
                include: {
                  batch: true,
                },
              },
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      if (sale.status !== "RETURNED") {
        throw new Error("Sale must be returned before restoring to inventory");
      }

      // Check if already restored
      const existingLog = await tx.auditLog.findFirst({
        where: {
          action: "RESTORE_TO_INVENTORY",
          entity: "PharmacySale",
          entityId: id,
        },
      });

      if (existingLog) {
        throw new Error("Sale items already restored to inventory");
      }

      // Return stock to batches
      for (const saleItem of sale.saleItems) {
        for (const saleBatch of saleItem.batches) {
          const currentBatch = await tx.productBatch.findUnique({
            where: { id: saleBatch.batchId },
          });

          if (!currentBatch) {
            throw new Error(`Batch ${saleBatch.batchId} no longer exists`);
          }

          const now = new Date();
          const isExpired = currentBatch.expiryDate ? currentBatch.expiryDate < now : false;

          await tx.productBatch.update({
            where: { id: saleBatch.batchId },
            data: {
              quantity: {
                increment: saleBatch.quantity,
              },
              status:
                currentBatch.status === "SOLD_OUT" && !isExpired
                  ? "ACTIVE"
                  : isExpired
                  ? "EXPIRED"
                  : currentBatch.status,
            },
          });
        }
      }

      // Log restoration
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "RESTORE_TO_INVENTORY",
          entity: "PharmacySale",
          entityId: id,
          details: {
            saleId: sale.id,
            grandTotal: sale.grandTotal,
            itemsCount: sale.saleItems.length,
          },
        },
      });

      return sale;
    });

    // Fetch updated sale
    const completeSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        saleItems: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
            batches: {
              include: {
                batch: true,
              },
            },
          },
        },
      },
    });

    return successResponse(completeSale);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
      if (
        error.message.includes("not found") ||
        error.message.includes("must be returned") ||
        error.message.includes("already restored") ||
        error.message.includes("no longer exists")
      ) {
        return errorResponse(error.message, 400);
      }
    }

    console.error("Error restoring to inventory:", error);
    return errorResponse("Failed to restore items to inventory", 500);
  }
}

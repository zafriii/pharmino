import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";
import { deductFromInventory, addBackToInventory } from "@/lib/inventory-utils";
import { deductTabletsFromInventory } from "@/lib/inventory-tablet.utils";
import { z } from "zod";

const saleItemSchema = z.object({
  itemId: z.number().int().positive(),
  sellType: z.enum(['FULL_STRIP', 'SINGLE_TABLET', 'ML']).optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive()
});

const saleSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  subtotal: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD']),
  items: z.array(saleItemSchema).min(1, "At least one item is required")
});

const returnSaleSchema = z.object({
  saleId: z.number().int().positive(),
  returnReason: z.string().min(1, "Return reason is required")
});

// GET /api/sales - Get all sales
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');
    const dateFilter = searchParams.get('dateFilter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Handle date filter based on local date
    // Handle date filter 
    if (startDate || endDate) {
      // Prioritize explicit date range (from client-side local calc)
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    } else if (dateFilter) {
      // Fallback to server-side calc (UTC based) if no explicit dates
      const now = new Date();
      let filterStartDate: Date;
      let filterEndDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      switch (dateFilter) {
        case 'today':
          // Today: from 00:00:00 to 23:59:59 of current date
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          break;
        case 'week':
          // This week: from Monday 00:00:00 to Sunday 23:59:59
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, Monday is 1
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0, 0);
          filterEndDate = new Date(filterStartDate);
          filterEndDate.setDate(filterStartDate.getDate() + 6);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          // This month: from 1st 00:00:00 to last day 23:59:59
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        default:
          filterStartDate = new Date(0); // Beginning of time
      }

      where.createdAt = {
        gte: filterStartDate,
        lte: filterEndDate
      };
    }

    // Handle search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        // Search by sale ID (convert search to number if it's numeric)
        ...(isNaN(Number(searchTerm)) ? [] : [{ id: Number(searchTerm) }]),
        // Search by customer name
        {
          customer: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        },
        // Search by creator/cashier name
        {
          creator: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Get stats for all filtered sales (not paginated)
    const [
      total,
      completed,
      returned,
      totalDiscount
    ] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.sale.count({ where: { ...where, status: "RETURNED" } }),
      prisma.sale.aggregate({
        _sum: { discountAmount: true },
        where
      }).then(res => res._sum.discountAmount || 0)
    ]);

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        saleItems: {
          include: {
            item: {
              select: { id: true, itemName: true, genericName: true, brand: true }
            },
            batches: {
              include: {
                batch: {
                  select: { id: true, batchNumber: true, expiryDate: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse({
      sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        completed,
        returned,
        totalDiscount
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching sales:", error);
    return errorResponse("Failed to fetch sales", 500);
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  let requestBody: any = null;

  try {
    const user = await requireEvery();
    requestBody = await request.json();

    const validatedData = saleSchema.parse(requestBody);

    // Validate customer exists if provided
    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId }
      });
      if (!customer) {
        return errorResponse("Customer not found", 404);
      }
    }

    // Validate all items exist and have sufficient stock in ACTIVE batches
    const itemValidations = await Promise.all(
      validatedData.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.itemId },
          include: {
            inventory: true,
            batches: {
              where: {
                OR: [
                  { quantity: { gt: 0 } }, // Complete strips available
                  { remainingTablets: { gt: 0 } } // Partial strips available
                ],
                status: 'ACTIVE' // Only check ACTIVE batches for sales
              }
            }
          }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.itemId} not found`);
        }

        // Calculate available quantity from ACTIVE batches only
        const activeStock = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);

        // Handle validation based on sell type
        if (item.sellType === 'SINGLE_TABLET' && product.tabletsPerStrip) {
          // For tablet sales, calculate total available tablets including partial strips
          const availableTablets = product.batches.reduce((sum, batch) => {
            const completeStripTablets = batch.quantity * product.tabletsPerStrip!;
            const partialTablets = batch.remainingTablets || 0;
            return sum + completeStripTablets + partialTablets;
          }, 0);

          if (availableTablets < item.quantity) {
            throw new Error(`Insufficient tablets for ${product.itemName}. Available: ${availableTablets} tablets, Required: ${item.quantity} tablets`);
          }
        } else {
          // For strip/unit sales, compare directly
          if (activeStock < item.quantity) {
            throw new Error(`Insufficient active stock for ${product.itemName}. Available in active batches: ${activeStock}, Required: ${item.quantity}`);
          }
        }

        return { item, product, activeStock };
      })
    );

    const result = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          customerId: validatedData.customerId,
          subtotal: validatedData.subtotal,
          discountAmount: validatedData.discountAmount,
          grandTotal: validatedData.grandTotal,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          createdBy: user.id
        }
      });

      // Create payment automatically for the sale
      await tx.payment.create({
        data: {
          saleId: sale.id,
          amount: validatedData.grandTotal,
          method: validatedData.paymentMethod,
          status: 'PAID'
        }
      });

      // Create all sale items in parallel
      const saleItems = await Promise.all(
        validatedData.items.map(itemData =>
          tx.saleItem.create({
            data: {
              saleId: sale.id,
              itemId: itemData.itemId,
              sellType: itemData.sellType,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice,
              totalPrice: itemData.totalPrice
            }
          })
        )
      );

      // Execute all inventory deductions in parallel
      const deductionResults = await Promise.all(
        validatedData.items.map(async (itemData, index) => {
          console.log("Processing item for deduction:", {
            itemId: itemData.itemId,
            sellType: itemData.sellType,
            quantity: itemData.quantity
          });

          // Check if this is a tablet sale
          if (itemData.sellType === 'SINGLE_TABLET') {
            console.log("🔍 TABLET SALE DETECTED:", {
              itemId: itemData.itemId,
              quantity: itemData.quantity,
              sellType: itemData.sellType
            });

            // Get product info for tablets per strip
            const product = await tx.product.findUnique({
              where: { id: itemData.itemId },
              select: { tabletsPerStrip: true, itemName: true }
            });

            console.log("📦 PRODUCT INFO:", product);

            if (product?.tabletsPerStrip) {
              console.log("✅ USING TABLET DEDUCTION");
              // Use tablet-level deduction
              const result = await deductTabletsFromInventory(
                itemData.itemId,
                itemData.quantity, // This is the number of tablets
                product.tabletsPerStrip,
                tx
              );

              if (!result.success) {
                throw new Error(result.error || "Failed to deduct tablets from inventory");
              }

              console.log("📊 TABLET DEDUCTION RESULT:", {
                success: result.success,
                batchDeductions: result.batchDeductions,
                tabletDeductions: result.tabletDeductions
              });

              // Add debugging info to the result
              return {
                ...result,
                saleItemId: saleItems[index].id,
                isTabletSale: true,
                debugInfo: {
                  productName: product.itemName,
                  tabletsDeducted: itemData.quantity,
                  tabletsPerStrip: product.tabletsPerStrip,
                  stripsAffected: result.batchDeductions.reduce((sum, bd) => sum + bd.quantity, 0),
                  deductionType: "TABLET_LEVEL"
                }
              };
            } else {
              console.log("❌ NO TABLETS_PER_STRIP - FALLING BACK TO REGULAR");
            }
          } else {
            console.log("📋 REGULAR SALE:", {
              itemId: itemData.itemId,
              sellType: itemData.sellType,
              quantity: itemData.quantity
            });
          }

          console.log("📋 USING REGULAR STRIP DEDUCTION");
          // Regular inventory deduction for strips/units
          const result = await deductFromInventory(itemData.itemId, itemData.quantity, tx);
          if (!result.success) {
            throw new Error(result.error || "Failed to deduct from inventory");
          }

          console.log("📊 REGULAR DEDUCTION RESULT:", {
            success: result.success,
            batchDeductions: result.batchDeductions
          });

          return {
            ...result,
            saleItemId: saleItems[index].id,
            isTabletSale: false,
            debugInfo: {
              stripsDeducted: itemData.quantity,
              deductionType: "REGULAR_STRIP"
            }
          };
        })
      );

      // Create sale batch records efficiently
      const saleBatchData = [];
      for (const deductionResult of deductionResults) {
        for (const batchDeduction of deductionResult.batchDeductions) {
          // Get batch info for pricing
          const batch = await tx.productBatch.findUnique({
            where: { id: batchDeduction.batchId },
            select: { purchasePrice: true, sellingPrice: true }
          });

          if (batch) {
            saleBatchData.push({
              saleItemId: deductionResult.saleItemId,
              batchId: batchDeduction.batchId,
              quantity: batchDeduction.quantity,
              purchasePrice: batch.purchasePrice,
              sellingPrice: batch.sellingPrice
            });
          }
        }
      }

      // Create all sale batches in one operation
      if (saleBatchData.length > 0) {
        await tx.saleBatch.createMany({
          data: saleBatchData
        });
      }

      return {
        sale,
        debugInfo: {
          deductionResults: deductionResults.map(dr => dr.debugInfo).filter(Boolean)
        }
      };
    }, {
      timeout: 15000, // Increase timeout to 15 seconds
    });

    // Log the action outside the transaction to reduce transaction load
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_SALE",
          entity: "Sale",
          entityId: result.sale.id.toString(),
          details: {
            grandTotal: result.sale.grandTotal,
            itemCount: validatedData.items.length,
            paymentMethod: result.sale.paymentMethod
          },
        },
      });
    } catch (auditError) {
      // Log audit error but don't fail the sale
      console.error("Failed to create audit log:", auditError);
    }

    // Fetch the complete sale data to return
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        customer: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        saleItems: {
          include: {
            item: {
              select: { id: true, itemName: true, genericName: true, brand: true }
            },
            batches: {
              include: {
                batch: {
                  select: { id: true, batchNumber: true, expiryDate: true }
                }
              }
            }
          }
        }
      }
    });

    return successResponse({
      ...completeSale,
      debugInfo: result.debugInfo
    }, 201);
  } catch (error) {
    console.error("Error creating sale - Full error details:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      requestData: requestBody ? {
        itemCount: requestBody.items?.length,
        grandTotal: requestBody.grandTotal,
        paymentMethod: requestBody.paymentMethod
      } : null
    });

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
      if (error.message.includes("not found")) {
        return errorResponse(error.message, 404);
      }
      if (error.message.includes("Insufficient") || error.message.includes("No active batches")) {
        return errorResponse(error.message, 400);
      }
      if (error.message.includes("Transaction already closed") || error.message.includes("timeout")) {
        return errorResponse("Transaction timeout - please try again", 408);
      }
    }
    return errorResponse("Failed to create sale", 500);
  }
}

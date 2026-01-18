import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import { z } from "zod";

const createPaymentSchema = z.object({
  saleId: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD']),
  transactionReference: z.string().optional()
});

const refundPaymentSchema = z.object({
  paymentId: z.number().int().positive(),
  refundAmount: z.number().positive(),
  refundMethod: z.enum(['CASH', 'CARD']),
  refundReason: z.string().min(1, "Refund reason is required")
});

// GET /api/admin/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const search = searchParams.get('search');
    const dateFilter = searchParams.get('dateFilter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (status) where.status = status;
    if (method) where.method = method;

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

    // Add search functionality
    if (search) {
      where.OR = [
        {
          id: isNaN(parseInt(search)) ? undefined : parseInt(search)
        },
        {
          saleId: isNaN(parseInt(search)) ? undefined : parseInt(search)
        },
        {
          sale: {
            customer: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          sale: {
            customer: {
              phone: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ].filter(condition => Object.values(condition).some(value => value !== undefined));
    }

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      include: {
        sale: {
          include: {
            customer: true,
            creator: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse({
      payments,
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
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching payments:", error);
    return errorResponse("Failed to fetch payments", 500);
  }
}

// POST /api/admin/payments - Create a new payment (auto-created with sales)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const validatedData = createPaymentSchema.parse(body);

    // Validate sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: validatedData.saleId }
    });

    if (!sale) {
      return errorResponse("Sale not found", 404);
    }

    const payment = await prisma.payment.create({
      data: {
        saleId: validatedData.saleId,
        amount: validatedData.amount,
        method: validatedData.method,
        status: 'PAID',
        transactionReference: validatedData.transactionReference
      },
      include: {
        sale: {
          include: {
            customer: true,
            creator: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return successResponse(payment, 201);
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
    console.error("Error creating payment:", error);
    return errorResponse("Failed to create payment", 500);
  }
}

// PUT /api/admin/payments - Process refund
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const validatedData = refundPaymentSchema.parse(body);

    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        sale: true
      }
    });

    if (!payment) {
      return errorResponse("Payment not found", 404);
    }

    if (payment.status === 'REFUNDED') {
      return errorResponse("Payment is already fully refunded", 400);
    }

    const currentRefundedAmount = Number(payment.refundedAmount || 0);
    const paymentAmount = Number(payment.amount);
    const refundAmount = Number(validatedData.refundAmount);
    const totalRefundAmount = currentRefundedAmount + refundAmount;

    if (totalRefundAmount > paymentAmount) {
      return errorResponse("Refund amount exceeds payment amount", 400);
    }

    // Use precise comparison for decimal amounts
    const isFullRefund = Math.abs(totalRefundAmount - paymentAmount) < 0.01; // Within 1 cent
    const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    console.log('Refund calculation:', {
      paymentAmount,
      currentRefundedAmount,
      refundAmount,
      totalRefundAmount,
      isFullRefund,
      newStatus
    });

    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: validatedData.paymentId },
        data: {
          status: newStatus,
          refundReason: validatedData.refundReason,
          refundMethod: validatedData.refundMethod,
          refundedAmount: totalRefundAmount,
          refundedAt: new Date()
        },
        include: {
          sale: {
            include: {
              customer: true,
              creator: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      // Update sale payment status if fully refunded
      if (isFullRefund) {
        await tx.sale.update({
          where: { id: payment.saleId },
          data: {
            paymentStatus: 'REFUNDED'
          }
        });
      } else {
        await tx.sale.update({
          where: { id: payment.saleId },
          data: {
            paymentStatus: 'PARTIALLY_REFUNDED'
          }
        });
      }

      return updatedPayment;
    });

    return successResponse(result);
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
    console.error("Error processing refund:", error);
    return errorResponse("Failed to process refund", 500);
  }
}
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET /api/admin/payrolls - Get payroll records
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");
    const paymentStatus = searchParams.get("paymentStatus");
    const status = searchParams.get("status"); // Support both 'status' and 'paymentStatus'
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const month = searchParams.get("month"); // Format: YYYY-MM

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    // Support both 'status' and 'paymentStatus' parameters
    const statusValue = status || paymentStatus;
    if (statusValue && ["PENDING", "PAID"].includes(statusValue)) {
      where.paymentStatus = statusValue as "PENDING" | "PAID";
    }

    // Filter by month (YYYY-MM format)
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      if (year && monthNum) {
        const startOfMonth = new Date(year, monthNum - 1, 1);
        const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
        where.createdAt = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    } else if (startDate || endDate) {
      // Filter by date range (if month is not specified)
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Search by employee name, email, or phone
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Get total count
    const total = await prisma.payroll.count({ where });

    // Get payroll records with pagination
    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate statistics if userId is provided
    let stats = null;
    if (userId) {
      const aggregate = await prisma.payroll.aggregate({
        where: { userId },
        _sum: {
          baseSalary: true,
          allowances: true,
          deductions: true,
          netPay: true,
        },
        _count: true,
      });

      const pendingCount = await prisma.payroll.count({
        where: { userId, paymentStatus: "PENDING" },
      });

      const paidCount = await prisma.payroll.count({
        where: { userId, paymentStatus: "PAID" },
      });

      stats = {
        totalPayrolls: aggregate._count,
        totalBaseSalary: aggregate._sum.baseSalary?.toString() || "0",
        totalAllowances: aggregate._sum.allowances?.toString() || "0",
        totalDeductions: aggregate._sum.deductions?.toString() || "0",
        totalNetPay: aggregate._sum.netPay?.toString() || "0",
        pendingPayrolls: pendingCount,
        paidPayrolls: paidCount,
      };
    }

    return successResponse({
      payrolls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      ...(stats && { stats }),
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

    console.error("Error fetching payrolls:", error);
    return errorResponse("Internal server error", 500);
  }
}



























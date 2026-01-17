import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const expenseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

// GET - Fetch expenses with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.reason = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Handle period filter based on local date
    if (period) {
      const now = new Date();
      let filterStartDate: Date;
      let filterEndDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      switch (period) {
        case 'today':
          // Today: from 00:00:00 to 23:59:59 of current date
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          break;
        case 'week':
          // This week: from Monday 00:00:00 to Sunday 23:59:59
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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
        case 'year':
          // This year: from Jan 1st 00:00:00 to Dec 31st 23:59:59
          filterStartDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          filterEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          filterStartDate = new Date(0); // Beginning of time
      }

      const startDateStr = filterStartDate.toISOString().split('T')[0];
      const endDateStr = filterEndDate.toISOString().split('T')[0];
      
      where.date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr + 'T23:59:59.999Z'),
      };
    } else if (startDate && endDate) {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      where.date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr + 'T23:59:59.999Z'),
      };
    }

    // Get expenses with pagination
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      expenses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET Expenses Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        reason: validatedData.reason,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST Expense Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
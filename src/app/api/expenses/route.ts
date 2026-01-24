import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {requireEvery} from "@/lib/auth-utils";

const expenseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

// GET - /api/expenses Fetch expenses with pagination and filters
export async function GET(request: NextRequest) {
  try {

    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    await requireEvery();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const listFilter = searchParams.get("listFilter");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.reason = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Handle list filter for expense list
    if (listFilter && listFilter !== 'all') {
      const now = new Date();
      let filterStartDate: Date;
      let filterEndDate: Date;

      switch (listFilter) {
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
        default:
          filterStartDate = new Date(0); // Beginning of time
          filterEndDate = new Date(); // Now
      }

      const startDateStr = filterStartDate.toISOString().split('T')[0];
      const endDateStr = filterEndDate.toISOString().split('T')[0];
      
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

// POST - Create new expense - /api/expenses
export async function POST(request: NextRequest) {
  try {
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });

    // if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const every = await requireEvery();

    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        reason: validatedData.reason,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        // createdBy: session.user.id,
        createdBy: every.id,
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
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
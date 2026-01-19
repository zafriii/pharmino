import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalePaymentStatus } from "@/generated/prisma";

// GET - Fetch detailed expense analytics with daily breakdown by category
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week";

    const now = new Date();
    let startDate: Date, endDate: Date;

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam && endDateParam) {
      // Use explicit dates from client
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Fallback to server-side calc
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case "week":
          // Last 7 days ending with today
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case "year":
          // Last 12 months
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          startDate = new Date(currentYear, currentMonth - 11, 1, 0, 0, 0, 0);
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
          break;
        case "all":
          if (startDateParam && endDateParam) {
            // Use explicit dates from client for "all" filter too
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
          } else {
            // Find earliest date from all sources only when no explicit dates provided
            const [earliestExpense, earliestPayroll, earliestReceived] = await Promise.all([
              prisma.expense.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
              prisma.payroll.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
              prisma.receivedItem.findFirst({ orderBy: { receivedAt: 'asc' }, select: { receivedAt: true } })
            ]);

            const dates = [
              earliestExpense?.date,
              earliestPayroll?.createdAt,
              earliestReceived?.receivedAt
            ].filter((d): d is Date => !!d);

            startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          }
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    }

    // Get detailed expense breakdown by date
    const chartData = await getDetailedExpenseChartData(startDate, endDate, period);

    // Calculate totals for the period
    const totalPayroll = chartData.reduce((sum, item) => sum + item.payroll, 0);
    const totalProducts = chartData.reduce((sum, item) => sum + item.products, 0);
    const totalOther = chartData.reduce((sum, item) => sum + item.other, 0);
    const totalExpenses = totalPayroll + totalProducts + totalOther;

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      totals: {
        payroll: totalPayroll,
        products: totalProducts,
        other: totalOther,
        total: totalExpenses,
      },
      chartData,
    });
  } catch (error) {
    console.error("GET Expense Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense analytics data" },
      { status: 500 }
    );
  }
}

async function getDetailedExpenseChartData(startDate: Date, endDate: Date, period: string) {
  // For all periods including "all", group by day to show individual dates with data
  // Skip days with no data to avoid empty points

  const chartData = [];
  const currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000) - 1);

    // Other expenses (@db.Date field)
    // We must pick exactly ONE local date string to avoid duplication due to range casting.
    const targetDate = new Date(dayStart.getTime() + (12 * 60 * 60 * 1000));
    const targetDateString = targetDate.toISOString().split('T')[0];

    const [payrollData, productData, otherExpenses] = await Promise.all([
      // Payroll expenses
      prisma.payroll.aggregate({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          paymentStatus: "PAID",
        },
        _sum: {
          netPay: true,
        },
      }),
      // Product costs (received items)
      prisma.receivedItem.findMany({
        where: {
          receivedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          purchaseItem: true,
        },
      }),
      // Other expenses
      prisma.expense.aggregate({
        where: {
          date: new Date(targetDateString),
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const payrollAmount = Number(payrollData._sum?.netPay || 0);
    const productAmount = productData.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );
    const otherAmount = Number(otherExpenses._sum?.amount || 0);
    const totalAmount = payrollAmount + productAmount + otherAmount;

    // Only add data points for days that have any expenses > 0
    if (totalAmount > 0) {
      chartData.push({
        date: dayStart.toISOString(), // Send ISO for client labeling
        payroll: payrollAmount,
        products: productAmount,
        other: otherAmount,
        total: totalAmount,
      });
    }

    currentDate.setTime(currentDate.getTime() + (24 * 60 * 60 * 1000));
  }

  console.log(`Generated ${chartData.length} expense data points for period ${period}`);
  return chartData;
}


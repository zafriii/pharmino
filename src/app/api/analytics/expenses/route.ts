import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalePaymentStatus } from "@/generated/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";

// GET - Fetch detailed expense analytics with daily breakdown by category
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
          // Find earliest date from all sources
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
  if (period === 'year' || period === 'all') {
    // For year/all period, group by month
    const chartData = [];
    const now = new Date();

    // Calculate how many months to show
    let monthsToShow = 12; // Default for year

    if (period === 'all') {
      const yearDiff = now.getFullYear() - startDate.getFullYear();
      const monthDiff = now.getMonth() - startDate.getMonth();
      monthsToShow = Math.max(1, (yearDiff * 12) + monthDiff + 1);

      // Safety cap to avoid massive loops if data is very old or messy
      if (monthsToShow > 120) monthsToShow = 120; // 10 years max
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate months ending with current month
    for (let i = monthsToShow - 1; i >= 0; i--) {
      let targetYear = currentYear;
      let targetMonth = currentMonth - i;

      // Handle negative months
      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const monthStart = new Date(targetYear, targetMonth, 1);
      const monthEnd = new Date(targetYear, targetMonth + 1, 1);

      try {
        const [payrollData, productData, otherExpenses] = await Promise.all([
          // Payroll expenses
          prisma.payroll.aggregate({
            where: {
              createdAt: {
                gte: monthStart,
                lt: monthEnd,
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
                gte: monthStart,
                lt: monthEnd,
              },
            },
            include: {
              purchaseItem: true,
            },
          }),
          // Other expenses
          prisma.expense.aggregate({
            where: {
              date: {
                gte: new Date(monthStart.toISOString().split('T')[0]),
                lt: new Date(monthEnd.toISOString().split('T')[0]),
              },
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

        chartData.push({
          date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`,
          payroll: payrollAmount,
          products: productAmount,
          other: otherAmount,
          total: payrollAmount + productAmount + otherAmount,
        });
      } catch (err) {
        console.error(`Error fetching expense data for ${monthStart}:`, err);
        chartData.push({
          date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`,
          payroll: 0,
          products: 0,
          other: 0,
          total: 0,
        });
      }
    }

    return chartData;
  }

  // For other periods (today, week, month), group by day, respecting input timezone
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

    chartData.push({
      date: dayStart.toISOString(), // Send ISO for client labeling
      payroll: payrollAmount,
      products: productAmount,
      other: otherAmount,
      total: payrollAmount + productAmount + otherAmount,
    });

    currentDate.setTime(currentDate.getTime() + (24 * 60 * 60 * 1000));
  }

  return chartData;
}


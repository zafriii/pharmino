import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const period = searchParams.get("period") || "month";
    // timezoneOffset in minutes (e.g., -360 for GMT+6)
    // If not provided, default to 0 (UTC)
    const timezoneOffset = parseInt(searchParams.get("timezoneOffset") || "0", 10);

    // Helper to get a Date object in UTC that corresponds to the Local Time start of day
    // For GMT+6 (Offset -360): Local 00:00 -> UTC 18:00 (Previous Day)
    // We want to construct the Local Time, then shift it back to UTC to query the DB

    // Current time in UTC
    const nowUtc = new Date();
    // Adjust to Local Time to calculate "Today", "Week", etc. based on user's calendar
    const nowLocal = new Date(nowUtc.getTime() - (timezoneOffset * 60 * 1000));

    let localStartDate: Date, localEndDate: Date;

    // Set date ranges based on LOCAL time
    switch (period) {
      case "today":
        localStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 0, 0, 0, 0);
        localEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);
        break;
      case "week":
        // Last 7 days ending with today
        localStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - 6, 0, 0, 0, 0);
        localEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);
        break;
      case "year":
        // Last 12 months
        const currentYear = nowLocal.getFullYear();
        const currentMonth = nowLocal.getMonth();
        // Start from 1st day of 11 months ago
        localStartDate = new Date(currentYear, currentMonth - 11, 1, 0, 0, 0, 0);
        // End at last moment of current month
        localEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        break;
      default: // month
        localStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1, 0, 0, 0, 0);
        localEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);
    }

    // Now shift these LOCAL times back to UTC for the database query
    const dbStartDate = new Date(localStartDate.getTime() + (timezoneOffset * 60 * 1000));
    const dbEndDate = new Date(localEndDate.getTime() + (timezoneOffset * 60 * 1000));

    // Get detailed expense breakdown by date
    const chartData = await getDetailedExpenseChartData(localStartDate, localEndDate, period, timezoneOffset);

    // Calculate totals for the period
    const totalPayroll = chartData.reduce((sum, item) => sum + item.payroll, 0);
    const totalProducts = chartData.reduce((sum, item) => sum + item.products, 0);
    const totalOther = chartData.reduce((sum, item) => sum + item.other, 0);
    const totalExpenses = totalPayroll + totalProducts + totalOther;

    return NextResponse.json({
      period,
      timezoneOffset,
      dateRange: {
        localStart: localStartDate,
        localEnd: localEndDate,
        dbStart: dbStartDate,
        dbEnd: dbEndDate
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

async function getDetailedExpenseChartData(localStartDate: Date, localEndDate: Date, period: string, timezoneOffset: number) {
  if (period === 'year') {
    // For year period, group by month (This logic is usually fine with UTC approximations, but let's be consistent)
    // Actually for 'year', using Local Date boundaries is safer.

    const chartData = [];
    // We iterate through months based on LOCAL time
    const startYear = localStartDate.getFullYear();
    const startMonth = localStartDate.getMonth();

    // We want 12 months up to the localEndDate
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(startYear, startMonth + i, 1);
      if (targetDate > localEndDate) break;

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const monthLocalStart = new Date(year, month, 1, 0, 0, 0, 0);
      const monthLocalEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Shift to UTC for DB
      const dbStart = new Date(monthLocalStart.getTime() + (timezoneOffset * 60 * 1000));
      const dbEnd = new Date(monthLocalEnd.getTime() + (timezoneOffset * 60 * 1000));

      // Use Date.UTC to ensure we are querying against UTC Midnight, ignoring server local time
      const expenseDateStart = new Date(Date.UTC(year, month, 1));
      const expenseDateEnd = new Date(Date.UTC(year, month + 1, 0));

      try {
        const [payrollData, productData, otherExpenses] = await Promise.all([
          // Payroll expenses
          prisma.payroll.aggregate({
            where: {
              createdAt: {
                gte: dbStart,
                lt: dbEnd,
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
                gte: dbStart,
                lt: dbEnd,
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
                gte: expenseDateStart,
                lte: expenseDateEnd,
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
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          payroll: payrollAmount,
          products: productAmount,
          other: otherAmount,
          total: payrollAmount + productAmount + otherAmount,
        });

      } catch (err) {
        console.error(`Error fetching expense data for month ${year}-${month}:`, err);
        chartData.push({
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          payroll: 0,
          products: 0,
          other: 0,
          total: 0,
        });
      }
    }
    return chartData;
  }

  // For other periods (today, week, month), group by day
  const days = [];
  const currentDate = new Date(localStartDate);

  // Create array of LOCAL days
  while (currentDate <= localEndDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const chartData = await Promise.all(
    days.map(async (localDate) => {
      // Define the day in LOCAL time
      const dayLocalStart = new Date(localDate);
      dayLocalStart.setHours(0, 0, 0, 0);

      const dayLocalEnd = new Date(localDate);
      dayLocalEnd.setHours(23, 59, 59, 999);

      // Convert boundaries to UTC for the database query
      const dbStart = new Date(dayLocalStart.getTime() + (timezoneOffset * 60 * 1000));
      const dbEnd = new Date(dayLocalEnd.getTime() + (timezoneOffset * 60 * 1000));

      // Use Date.UTC to ensure strict date matching (2026-01-18 maps to 2026-01-18 UTC)
      const expenseDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

      const [payrollData, productData, otherExpenses] = await Promise.all([
        // Payroll expenses
        prisma.payroll.aggregate({
          where: {
            createdAt: {
              gte: dbStart,
              lte: dbEnd,
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
              gte: dbStart,
              lte: dbEnd,
            },
          },
          include: {
            purchaseItem: true,
          },
        }),
        // Other expenses
        prisma.expense.aggregate({
          where: {
            date: expenseDate,
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

      // Format date as YYYY-MM-DD for consistency (using the Local Date)
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');

      return {
        date: `${year}-${month}-${day}`, // Return the local date string
        payroll: payrollAmount,
        products: productAmount,
        other: otherAmount,
        total: payrollAmount + productAmount + otherAmount,
      };
    })
  );

  return chartData;
}
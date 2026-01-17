import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalePaymentStatus } from "@/generated/prisma";

// GET - Fetch profit loss analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, year (removed today)
    const compare = searchParams.get("compare") === "true"; // Compare with previous period

    // Redirect 'today' to 'week' for profit/loss
    if (period === "today") {
      return NextResponse.redirect(new URL(request.url.replace('period=today', 'period=week')));
    }

    const now = new Date();
    let startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date;

    // Set date ranges based on period using local date logic
    switch (period) {
      case "week":
        // This week: from Monday 00:00:00 to Sunday 23:59:59
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        // Previous week
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(startDate.getDate() - 7);
        prevEndDate = new Date(prevStartDate);
        prevEndDate.setDate(prevStartDate.getDate() + 6);
        prevEndDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        // This year: from Jan 1st 00:00:00 to Dec 31st 23:59:59
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        // Previous year
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default: // month
        // This month: from 1st 00:00:00 to last day 23:59:59
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Previous month
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    // Calculate Revenue (from PAID and PARTIALLY_REFUNDED sales)
    const revenueQuery = {
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: {
          in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
        },
      },
    };

    const [currentRevenue, prevRevenue] = await Promise.all([
      prisma.sale.aggregate({
        ...revenueQuery,
        _sum: {
          grandTotal: true,
        },
      }),
      compare
        ? prisma.sale.aggregate({
            where: {
              createdAt: {
                gte: prevStartDate,
                lte: prevEndDate,
              },
              paymentStatus: {
                in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
              },
            },
            _sum: {
              grandTotal: true,
            },
          })
        : null,
    ]);

    // Calculate Payroll Expenses
    const [currentPayroll, prevPayroll] = await Promise.all([
      prisma.payroll.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          paymentStatus: "PAID",
        },
        _sum: {
          netPay: true,
        },
      }),
      compare
        ? prisma.payroll.aggregate({
            where: {
              createdAt: {
                gte: prevStartDate,
                lte: prevEndDate,
              },
              paymentStatus: "PAID",
            },
            _sum: {
              netPay: true,
            },
          })
        : null,
    ]);

    // Calculate Product Purchase Costs (from received items)
    // Calculate product costs manually since we need to multiply quantity * price
    const currentProductCostTotal = await prisma.receivedItem.findMany({
      where: {
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        purchaseItem: true,
      },
    });

    const prevProductCostTotal = compare
      ? await prisma.receivedItem.findMany({
          where: {
            receivedAt: {
              gte: prevStartDate,
              lte: prevEndDate,
            },
          },
          include: {
            purchaseItem: true,
          },
        })
      : [];

    const currentProductCostSum = currentProductCostTotal.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    const prevProductCostSum = prevProductCostTotal.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    // Calculate Other Expenses
    // For date-only fields, we need to use date strings in YYYY-MM-DD format
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const [currentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          date: {
            gte: new Date(startDateStr), // Convert back to Date for Prisma
            lte: new Date(endDateStr + 'T23:59:59.999Z'), // End of day
          },
        },
        _sum: {
          amount: true,
        },
      }),
      compare
        ? prisma.expense.aggregate({
            where: {
              date: {
                gte: new Date(prevStartDate.toISOString().split('T')[0]),
                lte: new Date(prevEndDate.toISOString().split('T')[0] + 'T23:59:59.999Z'),
              },
            },
            _sum: {
              amount: true,
            },
          })
        : null,
    ]);

    // Calculate totals
    const revenue = Number(currentRevenue._sum?.grandTotal || 0);
    const payrollExpenses = Number(currentPayroll._sum?.netPay || 0);
    const productExpenses = currentProductCostSum;
    const otherExpenses = Number(currentExpenses._sum?.amount || 0);
    const totalExpenses = payrollExpenses + productExpenses + otherExpenses;
    const profit = revenue - totalExpenses;

    const prevRevenueTotal = Number(prevRevenue?._sum?.grandTotal || 0);
    const prevPayrollTotal = Number(prevPayroll?._sum?.netPay || 0);
    const prevOtherExpensesTotal = Number(prevExpenses?._sum?.amount || 0);
    const prevTotalExpenses = prevPayrollTotal + prevProductCostSum + prevOtherExpensesTotal;
    const prevProfit = prevRevenueTotal - prevTotalExpenses;

    // Get detailed expense breakdown for chart
    const expenseBreakdown = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(startDateStr), // Use proper Date objects
          lte: new Date(endDateStr + 'T23:59:59.999Z'),
        },
      },
      select: {
        reason: true,
        amount: true,
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get daily/weekly/monthly revenue and expense data for chart
    const chartData = await getChartData(startDate, endDate, period);

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      current: {
        revenue,
        expenses: {
          payroll: payrollExpenses,
          products: productExpenses,
          other: otherExpenses,
          total: totalExpenses,
        },
        profit,
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : "0.00",
      },
      previous: compare
        ? {
            revenue: prevRevenueTotal,
            expenses: {
              payroll: prevPayrollTotal,
              products: prevProductCostSum,
              other: prevOtherExpensesTotal,
              total: prevTotalExpenses,
            },
            profit: prevProfit,
            profitMargin: prevRevenueTotal > 0 ? ((prevProfit / prevRevenueTotal) * 100).toFixed(2) : "0.00",
          }
        : null,
      changes: compare
        ? {
            revenue: prevRevenueTotal > 0 ? (((revenue - prevRevenueTotal) / prevRevenueTotal) * 100).toFixed(2) : "0.00",
            expenses: prevTotalExpenses > 0 ? (((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100).toFixed(2) : "0.00",
            profit: prevProfit !== 0 ? (((profit - prevProfit) / Math.abs(prevProfit)) * 100).toFixed(2) : "0.00",
          }
        : null,
      expenseBreakdown,
      chartData,
    });
  } catch (error) {
    console.error("GET Profit Loss Analytics Error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function getChartData(startDate: Date, endDate: Date, period: string) {
  // For year period, group by month to avoid too many queries
  // For month period, group by day
  // For week/today, group by day
  
  if (period === 'year') {
    // Group by month for year view
    const months = [];
    const currentYear = new Date().getFullYear();
    
    // Generate months from January (0) to December (11) of current year
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1, 0, 0, 0, 0);
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);
      
      months.push({ start: new Date(monthStart), end: new Date(monthEnd) });
    }

    console.log("Year view - Generating months for year:", currentYear);
    console.log("Months generated:", months.map(m => `${m.start.toISOString().split('T')[0]} to ${m.end.toISOString().split('T')[0]}`));

    const chartData = await Promise.all(
      months.map(async ({ start, end }) => {
        const [revenue, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
          prisma.sale.aggregate({
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
              paymentStatus: {
                in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
              },
            },
            _sum: {
              grandTotal: true,
            },
          }),
          prisma.expense.aggregate({
            where: {
              date: {
                gte: new Date(start.toISOString().split('T')[0]),
                lte: new Date(end.toISOString().split('T')[0] + 'T23:59:59.999Z'),
              },
            },
            _sum: {
              amount: true,
            },
          }),
          prisma.payroll.aggregate({
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
              paymentStatus: "PAID",
            },
            _sum: {
              netPay: true,
            },
          }),
          prisma.receivedItem.findMany({
            where: {
              receivedAt: {
                gte: start,
                lte: end,
              },
            },
            include: {
              purchaseItem: true,
            },
          }),
        ]);

        const productCostSum = productCosts.reduce(
          (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
          0
        );

        const totalExpenses = Number(otherExpenses._sum?.amount || 0) + 
                             Number(payrollExpenses._sum?.netPay || 0) + 
                             productCostSum;

        return {
          date: start.toISOString().split('T')[0],
          revenue: Number(revenue._sum?.grandTotal || 0),
          expenses: totalExpenses,
        };
      })
    );

    console.log("Year chart data generated:", chartData.map(d => `${d.date}: Revenue=${d.revenue}, Expenses=${d.expenses}`));
    return chartData;
  }
  
  // For other periods (week, month), group by day
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const chartData = await Promise.all(
    days.map(async (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const [revenue, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            paymentStatus: {
              in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
            },
          },
          _sum: {
            grandTotal: true,
          },
        }),
        prisma.expense.aggregate({
          where: {
            date: {
              gte: new Date(dayStart.toISOString().split('T')[0]),
              lte: new Date(dayEnd.toISOString().split('T')[0] + 'T23:59:59.999Z'),
            },
          },
          _sum: {
            amount: true,
          },
        }),
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
      ]);

      const productCostSum = productCosts.reduce(
        (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
        0
      );

      const totalExpenses = Number(otherExpenses._sum?.amount || 0) + 
                           Number(payrollExpenses._sum?.netPay || 0) + 
                           productCostSum;

      return {
        date: date.toISOString().split('T')[0],
        revenue: Number(revenue._sum?.grandTotal || 0),
        expenses: totalExpenses,
      };
    })
  );

  return chartData;
}
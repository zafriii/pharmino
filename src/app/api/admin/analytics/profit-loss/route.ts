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
    const period = searchParams.get("period") || "week"; // week, month, year (removed today)
    const compare = searchParams.get("compare") === "true"; // Compare with previous period

    // Redirect 'today' to 'week' for profit/loss
    if (period === "today") {
      return NextResponse.redirect(new URL(request.url.replace('period=today', 'period=week')));
    }

    const now = new Date();
    let startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date;

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam && endDateParam) {
      // Use explicit dates from client
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);

      console.log("Using explicit date range:", {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Calculate previous period based on selected period logic for consistency
      switch (period) {
        case "week":
          prevStartDate = new Date(startDate);
          prevStartDate.setDate(startDate.getDate() - 7);
          prevEndDate = new Date(endDate);
          prevEndDate.setDate(endDate.getDate() - 7);
          break;
        case "year":
          prevStartDate = new Date(startDate);
          prevStartDate.setFullYear(startDate.getFullYear() - 1);
          prevEndDate = new Date(endDate);
          prevEndDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case "all":
          // No comparison for "All Time" even with explicit dates
          prevStartDate = new Date(startDate);
          prevEndDate = new Date(endDate);
          break;
        case "month":
        default:
          // For month, subtract 1 month
          prevStartDate = new Date(startDate);
          prevStartDate.setMonth(startDate.getMonth() - 1);
          prevEndDate = new Date(endDate);
          prevEndDate.setMonth(endDate.getMonth() - 1);
          // Handle month edge cases (like March 31 -> Feb 28) automatically handled by Date, 
          // but for strict comparison we might want to align dates. 
          // Given the client sends "Start of Month" to "End of Month", subtracting 1 month usually works well for "Previous Month".
          break;
      }
    } else {
      // Fallback to server-side calc (UTC)
      console.log("Current date:", now.toISOString(), "Local:", now.toLocaleDateString());

      switch (period) {
        case "week":
          // Last 7 days ending with today (not calendar week)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          // Previous 7 days (8-14 days ago)
          prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
          break;
        case "year":
          // Last 12 months: from 12 months ago to current month end
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          // Start from 12 months ago
          startDate = new Date(currentYear, currentMonth - 11, 1, 0, 0, 0, 0);
          // End at the end of current month
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
          // Previous 12 months (12-23 months ago)
          prevStartDate = new Date(currentYear, currentMonth - 23, 1, 0, 0, 0, 0);
          prevEndDate = new Date(currentYear, currentMonth - 11, 0, 23, 59, 59, 999);
          break;
        case "all":
          if (startDateParam && endDateParam) {
            // Use explicit dates from client for "all" filter too
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
          } else {
            // Find earliest date from all sources only when no explicit dates provided
            const [earliestSale, earliestExpense, earliestPayroll, earliestReceived] = await Promise.all([
              prisma.sale.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
              prisma.expense.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
              prisma.payroll.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
              prisma.receivedItem.findFirst({ orderBy: { receivedAt: 'asc' }, select: { receivedAt: true } })
            ]);

            const dates = [
              earliestSale?.createdAt,
              earliestExpense?.date,
              earliestPayroll?.createdAt,
              earliestReceived?.receivedAt
            ].filter((d): d is Date => !!d);

            startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          }

          // No comparison for "All Time"
          prevStartDate = new Date(startDate);
          prevEndDate = new Date(endDate);
          break;
        default: // month
          // This month: from 1st 00:00:00 to today 23:59:59 (not the entire month)
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          // For current month, only go up to today, not the entire month
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          // Previous month
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      }
    }

    // Calculate Revenue (from PAID and PARTIALLY_REFUNDED sales with proper refund calculation)
    const currentSalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: {
          in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
        },
      },
      include: {
        payments: {
          select: {
            amount: true,
            status: true,
            refundedAmount: true
          }
        }
      }
    });

    const prevSalesData = compare ? await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        paymentStatus: {
          in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
        },
      },
      include: {
        payments: {
          select: {
            amount: true,
            status: true,
            refundedAmount: true
          }
        }
      }
    }) : [];

    // Calculate revenue properly
    const currentRevenue = currentSalesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum;
    }, 0);

    const prevRevenue = prevSalesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum;
    }, 0);

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

    // Calculate Other Expenses using local date strings to match browser/local view
    const localStartStr = new Date(startDate.getTime() + 12 * 3600000).toISOString().split('T')[0];
    const localEndStr = new Date(endDate.getTime() + 6 * 3600000).toISOString().split('T')[0];

    const [currentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          date: {
            gte: new Date(localStartStr), // Correct local start date
            lte: new Date(localEndStr),   // Correct local end date (inclusive for @db.Date)
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
              gte: new Date(new Date(prevStartDate.getTime() + 12 * 3600000).toISOString().split('T')[0]),
              lte: new Date(new Date(prevEndDate.getTime() + 6 * 3600000).toISOString().split('T')[0]),
            },
          },
          _sum: {
            amount: true,
          },
        })
        : null,
    ]);

    // Calculate totals
    const revenue = currentRevenue;
    const payrollExpenses = Number(currentPayroll._sum?.netPay || 0);
    const productExpenses = currentProductCostSum;
    const otherExpenses = Number(currentExpenses._sum?.amount || 0);
    const totalExpenses = payrollExpenses + productExpenses + otherExpenses;
    const profit = revenue - totalExpenses;

    const prevRevenueTotal = prevRevenue;
    const prevPayrollTotal = Number(prevPayroll?._sum?.netPay || 0);
    const prevOtherExpensesTotal = Number(prevExpenses?._sum?.amount || 0);
    const prevTotalExpenses = prevPayrollTotal + prevProductCostSum + prevOtherExpensesTotal;
    const prevProfit = prevRevenueTotal - prevTotalExpenses;

    // Get detailed expense breakdown for chart
    const expenseBreakdown = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(localStartStr),
          lte: new Date(localEndStr),
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
  // For all periods including "all", group by day to show individual dates with data
  // Skip days with no data to avoid empty points

  console.log("getChartData called with:", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    period: period
  });

  const chartData = [];
  const currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000) - 1);

    const targetDate = new Date(dayStart.getTime() + (12 * 60 * 60 * 1000));
    const targetDateString = targetDate.toISOString().split('T')[0];

    const [salesData, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          paymentStatus: {
            in: [SalePaymentStatus.PAID, SalePaymentStatus.PARTIALLY_REFUNDED],
          },
        },
        include: {
          payments: {
            select: {
              amount: true,
              status: true,
              refundedAmount: true
            }
          }
        }
      }),
      prisma.expense.aggregate({
        where: {
          date: new Date(targetDateString),
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

    // Calculate revenue properly
    const revenue = salesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum;
    }, 0);

    const productCostSum = productCosts.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    const totalExpenses = Number(otherExpenses._sum?.amount || 0) +
      Number(payrollExpenses._sum?.netPay || 0) +
      productCostSum;

    // Only add data points for days that have any activity (revenue or expenses > 0)
    if (revenue > 0 || totalExpenses > 0) {
      chartData.push({
        date: dayStart.toISOString(), // Send ISO for client labeling
        revenue: revenue,
        expenses: totalExpenses,
      });
    }

    currentDate.setTime(currentDate.getTime() + (24 * 60 * 60 * 1000));
  }

  console.log(`Generated ${chartData.length} data points for period ${period}`);
  return chartData;
}

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
    // timezoneOffset in minutes (e.g., -360 for GMT+6)
    const timezoneOffset = parseInt(searchParams.get("timezoneOffset") || "0", 10);

    // Redirect 'today' to 'week' for profit/loss
    if (period === "today") {
      return NextResponse.redirect(new URL(request.url.replace('period=today', 'period=week')));
    }

    // Current time in UTC
    const nowUtc = new Date();
    // Adjust to Local Time
    const nowLocal = new Date(nowUtc.getTime() - (timezoneOffset * 60 * 1000));

    let localStartDate: Date, localEndDate: Date;
    let localPrevStartDate: Date, localPrevEndDate: Date;

    // Set date ranges based on LOCAL time
    switch (period) {
      case "week":
        // Last 7 days ending with today
        localStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - 6, 0, 0, 0, 0);
        localEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);

        // Previous 7 days (8-14 days ago)
        localPrevStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - 13, 0, 0, 0, 0);
        localPrevEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - 7, 23, 59, 59, 999);
        break;
      case "year":
        // Last 12 months
        const currentYear = nowLocal.getFullYear();
        const currentMonth = nowLocal.getMonth();
        // Start from 12 months ago
        localStartDate = new Date(currentYear, currentMonth - 11, 1, 0, 0, 0, 0);
        // End at the end of current month
        localEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Previous 12 months (12-23 months ago)
        localPrevStartDate = new Date(currentYear, currentMonth - 23, 1, 0, 0, 0, 0);
        localPrevEndDate = new Date(currentYear, currentMonth - 11, 0, 23, 59, 59, 999);
        break;
      default: // month
        // This month
        localStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1, 0, 0, 0, 0);
        // Only go up to today for current month? Or end of month? Original logic was up to today.
        // Let's stick to "Month so far" if that's the intention, or full month.
        // Original: endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        localEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);

        // Previous month
        localPrevStartDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth() - 1, 1, 0, 0, 0, 0);
        localPrevEndDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 0, 23, 59, 59, 999);
    }

    // Convert boundaries to UTC for the database query (Timestamps)
    const dbStartDate = new Date(localStartDate.getTime() + (timezoneOffset * 60 * 1000));
    const dbEndDate = new Date(localEndDate.getTime() + (timezoneOffset * 60 * 1000));

    const dbPrevStartDate = new Date(localPrevStartDate.getTime() + (timezoneOffset * 60 * 1000));
    const dbPrevEndDate = new Date(localPrevEndDate.getTime() + (timezoneOffset * 60 * 1000));

    // For Expenses (Date Only), we use strict UTC Midnight
    // We ignore the offset shifting for the "Date" field matching
    // But we need to know WHICH days to include.
    // Basically, if the range includes "Jan 18" locally, we want "Jan 18 UTC".
    const expenseDateStart = new Date(Date.UTC(localStartDate.getFullYear(), localStartDate.getMonth(), localStartDate.getDate()));
    const expenseDateEnd = new Date(Date.UTC(localEndDate.getFullYear(), localEndDate.getMonth(), localEndDate.getDate()));

    const expensePrevDateStart = new Date(Date.UTC(localPrevStartDate.getFullYear(), localPrevStartDate.getMonth(), localPrevStartDate.getDate()));
    const expensePrevDateEnd = new Date(Date.UTC(localPrevEndDate.getFullYear(), localPrevEndDate.getMonth(), localPrevEndDate.getDate()));

    // Calculate Revenue
    const currentSalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: dbStartDate,
          lte: dbEndDate,
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
          gte: dbPrevStartDate,
          lte: dbPrevEndDate,
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

    // Calculate revenue helper
    const calculateRevenue = (sales: any[]) => {
      return sales.reduce((sum, sale) => {
        if (sale.paymentStatus === "PAID") {
          return sum + Number(sale.grandTotal);
        } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
          const totalRefunded = sale.payments.reduce((refundSum: number, payment: any) => {
            return refundSum + (Number(payment.refundedAmount) || 0);
          }, 0);
          const remainingAmount = Number(sale.grandTotal) - totalRefunded;
          return sum + Math.max(0, remainingAmount);
        }
        return sum;
      }, 0);
    };

    const currentRevenue = calculateRevenue(currentSalesData);
    const prevRevenue = calculateRevenue(prevSalesData);

    // Calculate Payroll Expenses
    const [currentPayroll, prevPayroll] = await Promise.all([
      prisma.payroll.aggregate({
        where: {
          createdAt: {
            gte: dbStartDate,
            lte: dbEndDate,
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
              gte: dbPrevStartDate,
              lte: dbPrevEndDate,
            },
            paymentStatus: "PAID",
          },
          _sum: {
            netPay: true,
          },
        })
        : null,
    ]);

    // Calculate Product Purchase Costs
    const currentProductCostTotal = await prisma.receivedItem.findMany({
      where: {
        receivedAt: {
          gte: dbStartDate,
          lte: dbEndDate,
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
            gte: dbPrevStartDate,
            lte: dbPrevEndDate,
          },
        },
        include: {
          purchaseItem: true,
        },
      })
      : [];

    const calculateProductCosts = (items: any[]) => {
      return items.reduce(
        (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
        0
      );
    };

    const currentProductCostSum = calculateProductCosts(currentProductCostTotal);
    const prevProductCostSum = calculateProductCosts(prevProductCostTotal);

    // Calculate Other Expenses (Using UTC Date boundaries)
    const [currentExpenses, prevExpenses] = await Promise.all([
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
      compare
        ? prisma.expense.aggregate({
          where: {
            date: {
              gte: expensePrevDateStart,
              lte: expensePrevDateEnd,
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
          gte: expenseDateStart,
          lte: expenseDateEnd,
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
    const chartData = await getChartData(localStartDate, localEndDate, period, timezoneOffset);

    return NextResponse.json({
      period,
      dateRange: {
        start: localStartDate,
        end: localEndDate,
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
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: String(error) },
      { status: 500 }
    );
  }
}

async function getChartData(localStartDate: Date, localEndDate: Date, period: string, timezoneOffset: number) {

  if (period === 'year') {
    const chartData = [];
    const startYear = localStartDate.getFullYear();
    const startMonth = localStartDate.getMonth();

    // Generate 12 months (or the range between localStartDate and localEndDate if different)
    // The main logic was "last 12 months" so localStartDate is 11 months ago.

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(startYear, startMonth + i, 1);
      if (targetDate > localEndDate) break;

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      // Local month boundaries
      const monthLocalStart = new Date(year, month, 1, 0, 0, 0, 0);
      const monthLocalEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // DB Timestamp boundaries
      const dbStart = new Date(monthLocalStart.getTime() + (timezoneOffset * 60 * 1000));
      const dbEnd = new Date(monthLocalEnd.getTime() + (timezoneOffset * 60 * 1000));

      // Expense Date boundaries (UTC Midnight)
      const expenseDateStart = new Date(Date.UTC(year, month, 1));
      const expenseDateEnd = new Date(Date.UTC(year, month + 1, 0)); // End of month

      try {
        const [salesData, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
          prisma.sale.findMany({
            where: {
              createdAt: {
                gte: dbStart,
                lt: dbEnd, // Use lt for next month start vs lte end of month, essentially same gap. let's use lt logic from previous code generally.
                // Wait, previous code used gte date lt nextMonth.
                // Here we have specific boundaries. lte dbEnd is fine.
                lte: dbEnd,
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
              date: {
                gte: expenseDateStart,
                lte: expenseDateEnd,
              },
            },
            _sum: {
              amount: true,
            },
          }),
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
        ]);

        const revenue = salesData.reduce((sum, sale) => {
          if (sale.paymentStatus === "PAID") {
            return sum + Number(sale.grandTotal);
          } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
            const totalRefunded = sale.payments.reduce((refundSum: number, payment: any) => {
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

        chartData.push({
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          revenue: revenue,
          expenses: totalExpenses,
        });
      } catch (err) {
        console.error(`Error fetching data for ${year}-${month}:`, err);
        chartData.push({
          date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
          revenue: 0,
          expenses: 0,
        });
      }
    }

    return chartData;
  }

  // For other periods (week, month), group by day
  const days = [];
  const currentDate = new Date(localStartDate);

  while (currentDate <= localEndDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const chartData = await Promise.all(
    days.map(async (localDate) => {
      // Local day boundaries
      const dayLocalStart = new Date(localDate);
      dayLocalStart.setHours(0, 0, 0, 0);
      const dayLocalEnd = new Date(localDate);
      dayLocalEnd.setHours(23, 59, 59, 999);

      // DB boundaries (Shifted)
      const dbStart = new Date(dayLocalStart.getTime() + (timezoneOffset * 60 * 1000));
      const dbEnd = new Date(dayLocalEnd.getTime() + (timezoneOffset * 60 * 1000));

      // Expense boundaries (UTC Midnight)
      const expenseDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

      const [salesData, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: dbStart,
              lte: dbEnd,
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
            date: expenseDate,
          },
          _sum: {
            amount: true,
          },
        }),
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
      ]);

      const revenue = salesData.reduce((sum, sale) => {
        if (sale.paymentStatus === "PAID") {
          return sum + Number(sale.grandTotal);
        } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
          const totalRefunded = sale.payments.reduce((refundSum: number, payment: any) => {
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

      // Format date as YYYY-MM-DD
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');

      return {
        date: `${year}-${month}-${day}`,
        revenue: revenue,
        expenses: totalExpenses,
      };
    })
  );

  return chartData;
}
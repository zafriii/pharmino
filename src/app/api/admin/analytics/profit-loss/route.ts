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
    console.log("Current date:", now.toISOString(), "Local:", now.toLocaleDateString());
    
    switch (period) {
      case "week":
        // Last 7 days ending with today (not calendar week)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        // Previous 7 days (8-14 days ago)
        prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
        console.log("Week period date range (last 7 days):", {
          current: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          today: now.getDate(),
          daysShown: 7
        });
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
        console.log("Year period date range:", {
          current: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          previous: `${prevStartDate.toISOString().split('T')[0]} to ${prevEndDate.toISOString().split('T')[0]}`,
          currentMonth: currentMonth,
          currentYear: currentYear,
          startMonth: startDate.getMonth(),
          startYear: startDate.getFullYear(),
          endMonth: endDate.getMonth(),
          endYear: endDate.getFullYear()
        });
        break;
      default: // month
        // This month: from 1st 00:00:00 to today 23:59:59 (not the entire month)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        // For current month, only go up to today, not the entire month
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        // Previous month
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        console.log("Month period date range:", {
          current: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          today: now.getDate(),
          endDay: endDate.getDate()
        });
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
  
  console.log("getChartData called with:", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    period: period
  });
  
  if (period === 'year') {
    // Use exact same logic as dashboard but for 12 months instead of 6
    const chartData = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    console.log("Current date info:", {
      currentDate: currentDate.toISOString(),
      currentYear: currentYear,
      currentMonth: currentMonth,
      currentMonthName: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
    
    // Generate last 12 months ending with current month
    for (let i = 11; i >= 0; i--) {
      // Calculate target year and month
      let targetYear = currentYear;
      let targetMonth = currentMonth - i;
      
      // Handle negative months properly
      while (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      
      // Create date for the first day of the target month
      const date = new Date(targetYear, targetMonth, 1);
      const nextMonth = new Date(targetYear, targetMonth + 1, 1);
      
      console.log(`Month ${i}: targetYear=${targetYear}, targetMonth=${targetMonth}, date=${date.toISOString()}, formatted=${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
      
      try {
        const [salesData, otherExpenses, payrollExpenses, productCosts] = await Promise.all([
          prisma.sale.findMany({
            where: {
              createdAt: {
                gte: date,
                lt: nextMonth,
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
                gte: new Date(date.toISOString().split('T')[0]),
                lt: new Date(nextMonth.toISOString().split('T')[0]),
              },
            },
            _sum: {
              amount: true,
            },
          }),
          prisma.payroll.aggregate({
            where: {
              createdAt: {
                gte: date,
                lt: nextMonth,
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
                gte: date,
                lt: nextMonth,
              },
            },
            include: {
              purchaseItem: true,
            },
          }),
        ]);

        // Calculate revenue properly (same as dashboard)
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

        // Use the first day of the month as the date for consistency
        chartData.push({
          date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`,
          revenue: revenue,
          expenses: totalExpenses,
        });
      } catch (err) {
        console.error(`Error fetching data for ${date}:`, err);
        chartData.push({
          date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`,
          revenue: 0,
          expenses: 0,
        });
      }
    }

    console.log("Year chart data generated:", chartData.map(d => `${d.date}: Revenue=${d.revenue}, Expenses=${d.expenses} (${(() => {
      const [year, month] = d.date.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    })()})`));
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

      // Format date as YYYY-MM-DD for consistency
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return {
        date: `${year}-${month}-${day}`,
        revenue: revenue,
        expenses: totalExpenses,
      };
    })
  );

  return chartData;
}
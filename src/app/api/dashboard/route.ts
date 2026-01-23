import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery } from "@/lib/auth-utils";

// Helper function to calculate date ranges based on period
function getDateRange(period?: string, startDate?: string, endDate?: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let filterStartDate: Date;
  let filterEndDate: Date;

  if (period === 'custom' && startDate && endDate) {
    filterStartDate = new Date(startDate);
    filterEndDate = new Date(endDate);
    filterEndDate.setHours(23, 59, 59, 999); // End of day
  } else if (period === '7days') {
    filterStartDate = new Date(today);
    filterStartDate.setDate(today.getDate() - 7);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  } else if (period === '30days') {
    filterStartDate = new Date(today);
    filterStartDate.setDate(today.getDate() - 30);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  } else if (period === 'lastmonth') {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    filterStartDate = lastMonth;
    filterEndDate = lastMonthEnd;
    filterEndDate.setHours(23, 59, 59, 999);
  } else {
    // Default: this month
    filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    filterEndDate = new Date(today);
    filterEndDate.setHours(23, 59, 59, 999);
  }

  return { filterStartDate, filterEndDate };
}

export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { filterStartDate, filterEndDate } = getDateRange(period || undefined, startDate || undefined, endDate || undefined);

    // Detect local today boundaries
    const todayStartParam = searchParams.get('todayStart');
    const todayEndParam = searchParams.get('todayEnd');

    const today = new Date();
    const todayStart = todayStartParam ? new Date(todayStartParam) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = todayEndParam ? new Date(todayEndParam) : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // For date-only fields (Expenses), we need a single local date string for "Today"
    // Use target date with 12h offset from todayStart to get the correct string
    const localTodayDateStr = new Date(todayStart.getTime() + 12 * 3600000).toISOString().split('T')[0];

    // Get current year and month for comparisons
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Previous month for comparison
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 1);

    // Start of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // End of today (for consistent date ranges across dashboard, payment method, and monthly chart)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);

    // For date fields, use date strings
    const todayDateStr = today.toISOString().split('T')[0];
    const startOfMonthDateStr = startOfMonth.toISOString().split('T')[0];
    const previousMonthDateStr = previousMonth.toISOString().split('T')[0];

    // Today's Snapshot Data - always show today's data regardless of filters
    console.log("Fetching today's snapshot data...");

    // Get today's sales with payments for proper revenue calculation
    const todaysSalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        },
        paymentStatus: {
          in: ['PAID', 'PARTIALLY_REFUNDED']
        }
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
    }).catch(err => {
      console.error("Error fetching today's sales:", err);
      return [];
    });

    // Calculate today's revenue properly
    const todaysRevenue = todaysSalesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum; // REFUNDED sales contribute 0
    }, 0);

    const todaysOrders = todaysSalesData.length;

    // Get today's returns/refunds
    const todaysReturns = await prisma.sale.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        },
        paymentStatus: 'REFUNDED'
      }
    }).catch(err => {
      console.error("Error fetching today's returns:", err);
      return 0;
    });

    // Get today's refund amount
    const todaysRefundAmount = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        },
        status: 'REFUNDED'
      },
      _sum: {
        refundedAmount: true
      }
    }).catch(err => {
      console.error("Error fetching today's refund amount:", err);
      return { _sum: { refundedAmount: null } };
    });

    // Get today's expenses (@db.Date field)
    const todaysOtherExpenses = await prisma.expense.aggregate({
      where: {
        date: new Date(localTodayDateStr)
      },
      _sum: {
        amount: true
      }
    }).catch(err => {
      console.error("Error fetching today's expenses:", err);
      return { _sum: { amount: null } };
    });

    // Get today's received items (purchases)
    const todaysReceivedItems = await prisma.receivedItem.findMany({
      where: {
        receivedAt: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      include: {
        purchaseItem: true
      }
    }).catch(err => {
      console.error("Error fetching today's received items:", err);
      return [];
    });

    // Calculate today's purchase value
    const todaysPurchaseValue = todaysReceivedItems.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    const todaysPurchaseCount = todaysReceivedItems.length;

    // For now, let's use simple counts for pending/active orders (removed as not used in new snapshot)
    // const pendingPayments = await prisma.sale.count({
    //   where: {
    //     paymentStatus: 'PAID'
    //   }
    // }).catch(err => {
    //   console.error("Error fetching pending payments:", err);
    //   return 0;
    // });

    // const activeOrders = todaysOrders; // Same as today's orders for now

    // Dashboard Stats Data - with proper revenue calculation using filtered date range
    console.log("Fetching dashboard stats with date range:", filterStartDate, "to", filterEndDate);

    // Get filtered period sales with payments
    const filteredSalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: filterStartDate,
          lte: filterEndDate
        },
        paymentStatus: {
          in: ['PAID', 'PARTIALLY_REFUNDED']
        }
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
    }).catch(err => {
      console.error("Error fetching filtered sales:", err);
      return [];
    });

    // Calculate total revenue properly (same as analytics)
    const totalRevenue = filteredSalesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum; // REFUNDED sales contribute 0
    }, 0);

    const totalOrdersData = filteredSalesData.length;

    // Get previous month sales with payments
    const previousMonthSalesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: previousMonthEnd
        },
        paymentStatus: {
          in: ['PAID', 'PARTIALLY_REFUNDED']
        }
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
    }).catch(err => {
      console.error("Error fetching previous month sales:", err);
      return [];
    });

    // Calculate previous month revenue properly
    const previousRevenue = previousMonthSalesData.reduce((sum, sale) => {
      if (sale.paymentStatus === "PAID") {
        return sum + Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        return sum + Math.max(0, remainingAmount);
      }
      return sum; // REFUNDED sales contribute 0
    }, 0);

    const previousMonthOrdersData = previousMonthSalesData.length;

    // 1. Other expenses from expense table (@db.Date fix)
    const localFilterStartStr = new Date(filterStartDate.getTime() + 12 * 3600000).toISOString().split('T')[0];
    const localFilterEndStr = new Date(filterEndDate.getTime() + 6 * 3600000).toISOString().split('T')[0];

    const totalExpensesData = await prisma.expense.aggregate({
      where: {
        date: {
          gte: new Date(localFilterStartStr),
          lte: new Date(localFilterEndStr)
        }
      },
      _sum: { amount: true }
    }).catch(err => {
      console.error("Error fetching total expenses:", err);
      return { _sum: { amount: null } };
    });

    // 2. Payroll expenses
    const payrollExpensesData = await prisma.payroll.aggregate({
      where: {
        createdAt: {
          gte: filterStartDate,
          lte: filterEndDate
        },
        paymentStatus: "PAID"
      },
      _sum: { netPay: true }
    }).catch(err => {
      console.error("Error fetching payroll expenses:", err);
      return { _sum: { netPay: null } };
    });

    // 3. Product costs from received items
    const productCostItems = await prisma.receivedItem.findMany({
      where: {
        receivedAt: {
          gte: filterStartDate,
          lte: filterEndDate
        }
      },
      include: {
        purchaseItem: true
      }
    }).catch(err => {
      console.error("Error fetching product costs:", err);
      return [];
    });

    const productCosts = productCostItems.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    const otherExpenses = Number(totalExpensesData._sum.amount || 0);
    const payrollExpenses = Number(payrollExpensesData._sum.netPay || 0);
    const totalExpenses = otherExpenses + payrollExpenses + productCosts;

    // Calculate previous month expenses properly
    const previousMonthExpensesData = await prisma.expense.aggregate({
      where: {
        date: {
          gte: new Date(previousMonthDateStr),
          lte: new Date(new Date(startOfMonth.getTime() - 12 * 3600000).toISOString().split('T')[0])
        }
      },
      _sum: { amount: true }
    }).catch(err => {
      console.error("Error fetching previous month expenses:", err);
      return { _sum: { amount: null } };
    });

    const previousPayrollExpensesData = await prisma.payroll.aggregate({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: previousMonthEnd
        },
        paymentStatus: "PAID"
      },
      _sum: { netPay: true }
    }).catch(err => {
      console.error("Error fetching previous payroll expenses:", err);
      return { _sum: { netPay: null } };
    });

    const previousProductCostItems = await prisma.receivedItem.findMany({
      where: {
        receivedAt: {
          gte: previousMonth,
          lt: previousMonthEnd
        }
      },
      include: {
        purchaseItem: true
      }
    }).catch(err => {
      console.error("Error fetching previous product costs:", err);
      return [];
    });

    const previousProductCosts = previousProductCostItems.reduce(
      (sum, item) => sum + (item.receivedQuantity * Number(item.purchaseItem.puchasePrice)),
      0
    );

    const previousOtherExpenses = Number(previousMonthExpensesData._sum.amount || 0);
    const previousPayrollExpenses = Number(previousPayrollExpensesData._sum.netPay || 0);
    const previousExpenses = previousOtherExpenses + previousPayrollExpenses + previousProductCosts;

    const totalRefundsData = await prisma.payment.aggregate({
      where: {
        status: 'REFUNDED'
      },
      _sum: { refundedAmount: true }
    }).catch(err => {
      console.error("Error fetching total refunds:", err);
      return { _sum: { refundedAmount: null } };
    });

    // Calculate stats
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = totalOrdersData > 0 ? totalRevenue / totalOrdersData : 0;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expensesChange = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const ordersChange = previousMonthOrdersData > 0 ? ((totalOrdersData - previousMonthOrdersData) / previousMonthOrdersData) * 100 : 0;

    console.log("Fetching category revenue...");
    // Revenue by Category - with proper payment status filtering using filtered date range
    const categoryRevenue = await prisma.saleItem.groupBy({
      by: ['itemId'],
      _sum: { totalPrice: true },
      _count: true,
      where: {
        sale: {
          createdAt: {
            gte: filterStartDate,
            lte: filterEndDate
          },
          paymentStatus: {
            in: ['PAID', 'PARTIALLY_REFUNDED']
          }
        }
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 5 // Limit to top 5 to avoid performance issues
    }).catch(err => {
      console.error("Error fetching category revenue:", err);
      return [];
    });

    const categoryData = [];
    for (const item of categoryRevenue) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: item.itemId },
          include: { category: true }
        });

        if (product) {
          categoryData.push({
            name: product.category.name || 'Unknown',
            value: Number(item._sum.totalPrice || 0),
            percentage: totalRevenue > 0 ? (Number(item._sum.totalPrice || 0) / totalRevenue) * 100 : 0
          });
        }
      } catch (err) {
        console.error(`Error fetching product ${item.itemId}:`, err);
      }
    }

    // Group by category and sum up
    const groupedCategories = categoryData.reduce((acc: any, item) => {
      const existing = acc.find((cat: any) => cat.name === item.name);
      if (existing) {
        existing.value += item.value;
        existing.percentage += item.percentage;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

    console.log("Fetching payment methods...");
    // Payment Method Analysis - with proper refund calculation using filtered date range
    const paymentMethodSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: filterStartDate,
          lte: filterEndDate
        },
        paymentStatus: {
          in: ['PAID', 'PARTIALLY_REFUNDED']
        }
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
    }).catch(err => {
      console.error("Error fetching payment method sales:", err);
      return [];
    });

    // Group by payment method and calculate actual revenue (same logic as totalRevenue)
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();

    paymentMethodSales.forEach(sale => {
      let actualAmount = 0;

      if (sale.paymentStatus === "PAID") {
        actualAmount = Number(sale.grandTotal);
      } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
        const totalRefunded = sale.payments.reduce((refundSum, payment) => {
          return refundSum + (Number(payment.refundedAmount) || 0);
        }, 0);
        const remainingAmount = Number(sale.grandTotal) - totalRefunded;
        actualAmount = Math.max(0, remainingAmount);
      }

      if (actualAmount > 0) {
        const method = sale.paymentMethod;
        const existing = paymentMethodMap.get(method) || { amount: 0, count: 0 };
        paymentMethodMap.set(method, {
          amount: existing.amount + actualAmount,
          count: existing.count + 1
        });
      }
    });

    const paymentMethodData = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method: method,
      amount: data.amount,
      count: data.count,
      percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
    }));

    console.log("Fetching payroll data...");
    // Payroll by Role - simplified using filtered date range
    const payrollData = await prisma.payroll.groupBy({
      by: ['userId'],
      _sum: { netPay: true },
      _count: true,
      where: {
        createdAt: {
          gte: filterStartDate,
          lte: filterEndDate
        }
      },
      orderBy: {
        _sum: {
          netPay: 'desc'
        }
      },
      take: 10 // Limit results
    }).catch(err => {
      console.error("Error fetching payroll data:", err);
      return [];
    });

    const rolePayroll = [];
    for (const payroll of payrollData) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payroll.userId },
          select: { role: true }
        });

        if (user) {
          rolePayroll.push({
            role: user.role || 'UNKNOWN',
            totalPaid: Number(payroll._sum.netPay || 0),
            count: payroll._count
          });
        }
      } catch (err) {
        console.error(`Error fetching user ${payroll.userId}:`, err);
      }
    }

    // Group by role
    const groupedRoles = rolePayroll.reduce((acc: any, item) => {
      const existing = acc.find((role: any) => role.role === item.role);
      if (existing) {
        existing.totalPaid += item.totalPaid;
        existing.employeeCount += item.count;
        existing.averageSalary = existing.totalPaid / existing.employeeCount;
      } else {
        acc.push({
          role: item.role,
          totalPaid: item.totalPaid,
          employeeCount: item.count,
          averageSalary: item.totalPaid / item.count
        });
      }
      return acc;
    }, []);

    console.log("Fetching top products...");
    // Top Selling Products - with proper refund handling using filtered date range
    const topProducts = await prisma.saleItem.groupBy({
      by: ['itemId'],
      _sum: {
        quantity: true,
        totalPrice: true
      },
      where: {
        sale: {
          createdAt: {
            gte: filterStartDate,
            lte: filterEndDate
          },
          paymentStatus: {
            in: ['PAID', 'PARTIALLY_REFUNDED']
          }
        }
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5 // Limit to top 5
    }).catch(err => {
      console.error("Error fetching top products:", err);
      return [];
    });

    const topProductsData = [];
    for (const item of topProducts) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: item.itemId },
          include: { category: true }
        });

        if (product) {
          // Get sales for this product to calculate proper revenue with refunds using filtered date range
          const productSales = await prisma.saleItem.findMany({
            where: {
              itemId: item.itemId,
              sale: {
                createdAt: {
                  gte: filterStartDate,
                  lte: filterEndDate
                },
                paymentStatus: {
                  in: ['PAID', 'PARTIALLY_REFUNDED']
                }
              }
            },
            include: {
              sale: {
                include: {
                  payments: {
                    select: {
                      refundedAmount: true
                    }
                  }
                }
              }
            }
          });

          // Calculate actual revenue considering refunds
          let actualRevenue = 0;
          let actualQuantity = 0;

          for (const saleItem of productSales) {
            if (saleItem.sale.paymentStatus === 'PAID') {
              actualRevenue += Number(saleItem.totalPrice);
              actualQuantity += saleItem.quantity;
            } else if (saleItem.sale.paymentStatus === 'PARTIALLY_REFUNDED') {
              const totalRefunded = saleItem.sale.payments.reduce((sum, payment) => {
                return sum + (Number(payment.refundedAmount) || 0);
              }, 0);

              // Calculate proportional refund for this item
              const saleTotal = Number(saleItem.sale.grandTotal);
              const itemProportion = Number(saleItem.totalPrice) / saleTotal;
              const itemRefund = totalRefunded * itemProportion;
              const itemActualRevenue = Number(saleItem.totalPrice) - itemRefund;

              if (itemActualRevenue > 0) {
                actualRevenue += itemActualRevenue;
                actualQuantity += saleItem.quantity;
              }
            }
          }

          // Get previous month data for growth calculation
          const previousMonthSales = await prisma.saleItem.findMany({
            where: {
              itemId: item.itemId,
              sale: {
                createdAt: {
                  gte: previousMonth,
                  lt: previousMonthEnd
                },
                paymentStatus: {
                  in: ['PAID', 'PARTIALLY_REFUNDED']
                }
              }
            },
            include: {
              sale: {
                include: {
                  payments: {
                    select: {
                      refundedAmount: true
                    }
                  }
                }
              }
            }
          });

          let previousQuantity = 0;
          for (const saleItem of previousMonthSales) {
            if (saleItem.sale.paymentStatus === 'PAID') {
              previousQuantity += saleItem.quantity;
            } else if (saleItem.sale.paymentStatus === 'PARTIALLY_REFUNDED') {
              const totalRefunded = saleItem.sale.payments.reduce((sum, payment) => {
                return sum + (Number(payment.refundedAmount) || 0);
              }, 0);

              const saleTotal = Number(saleItem.sale.grandTotal);
              const itemProportion = Number(saleItem.totalPrice) / saleTotal;
              const itemRefund = totalRefunded * itemProportion;
              const itemActualRevenue = Number(saleItem.totalPrice) - itemRefund;

              if (itemActualRevenue > 0) {
                previousQuantity += saleItem.quantity;
              }
            }
          }

          const growth = previousQuantity > 0 ? ((actualQuantity - previousQuantity) / previousQuantity) * 100 : 0;

          topProductsData.push({
            id: item.itemId,
            name: product.itemName || 'Unknown Product',
            category: product.category.name || 'Unknown',
            quantitySold: actualQuantity,
            revenue: actualRevenue,
            growth: growth
          });
        }
      } catch (err) {
        console.error(`Error fetching product ${item.itemId}:`, err);
      }
    }

    console.log("Fetching monthly data...");
    // Monthly Sales Chart - with proper revenue calculation
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      let nextMonth: Date;

      // For current month (i=0), only go up to today to match dashboard stats
      if (i === 0) {
        nextMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
      } else {
        nextMonth = new Date(currentYear, currentMonth - i + 1, 1);
      }

      console.log(`Dashboard month ${i}: currentMonth=${currentMonth}, currentMonth-i=${currentMonth - i}, date=${date.toISOString()}, nextMonth=${nextMonth.toISOString()}, formatted=${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);

      try {
        const monthSalesData = await prisma.sale.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextMonth
            },
            paymentStatus: {
              in: ['PAID', 'PARTIALLY_REFUNDED']
            }
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

        // Calculate monthly revenue properly
        const monthRevenue = monthSalesData.reduce((sum, sale) => {
          if (sale.paymentStatus === "PAID") {
            return sum + Number(sale.grandTotal);
          } else if (sale.paymentStatus === "PARTIALLY_REFUNDED" && sale.payments) {
            const totalRefunded = sale.payments.reduce((refundSum, payment) => {
              return refundSum + (Number(payment.refundedAmount) || 0);
            }, 0);
            const remainingAmount = Number(sale.grandTotal) - totalRefunded;
            return sum + Math.max(0, remainingAmount);
          }
          return sum; // REFUNDED sales contribute 0
        }, 0);

        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sales: monthRevenue,
          revenue: monthRevenue,
          orders: monthSalesData.length
        });
      } catch (err) {
        console.error(`Error fetching month data for ${date}:`, err);
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sales: 0,
          revenue: 0,
          orders: 0
        });
      }
    }

    console.log("Fetching inventory alerts...");
    // Inventory Alerts Data
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Products expiring within 2 days
    const expiringProducts = await prisma.productBatch.findMany({
      where: {
        status: 'ACTIVE',
        quantity: { gt: 0 },
        expiryDate: {
          lte: twoDaysFromNow
        }
      },
      include: {
        item: {
          select: {
            id: true,
            itemName: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      },
      take: 20 // Limit to prevent performance issues
    }).catch(err => {
      console.error("Error fetching expiring products:", err);
      return [];
    });

    const expiringProductsData = expiringProducts.map(batch => {
      const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : new Date();
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        id: batch.item.id,
        itemName: batch.item.itemName,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ? batch.expiryDate.toISOString().split('T')[0] : '',
        quantity: batch.quantity,
        daysUntilExpiry: daysUntilExpiry
      };
    });

    // Low stock and out of stock products
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' }
        ]
      },
      include: {
        product: {
          select: {
            id: true,
            itemName: true,
            lowStockThreshold: true
          }
        }
      },
      orderBy: {
        availableQuantity: 'asc'
      },
      take: 20 // Limit to prevent performance issues
    }).catch(err => {
      console.error("Error fetching inventory items:", err);
      return [];
    });

    const lowStockProducts = inventoryItems
      .filter(item => item.status === 'LOW_STOCK')
      .map(item => ({
        id: item.product.id,
        itemName: item.product.itemName,
        totalQuantity: item.availableQuantity,
        lowStockThreshold: item.product.lowStockThreshold,
        status: 'LOW_STOCK' as const
      }));

    const outOfStockProducts = inventoryItems
      .filter(item => item.status === 'OUT_OF_STOCK')
      .map(item => ({
        id: item.product.id,
        itemName: item.product.itemName,
        totalQuantity: item.availableQuantity,
        lowStockThreshold: item.product.lowStockThreshold,
        status: 'OUT_OF_STOCK' as const
      }));

    // Get total active products count
    const totalActiveProducts = await prisma.product.count({
      where: {
        status: 'ACTIVE'
      }
    }).catch(err => {
      console.error("Error fetching total products count:", err);
      return 0;
    });

    console.log("Preparing response data...");
    console.log("Revenue calculation debug:", {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      currentMonthSalesCount: filteredSalesData.length,
      previousMonthSalesCount: previousMonthSalesData.length
    });

    // Prepare response data with fallbacks
    const dashboardData = {
      todaysSnapshot: {
        todaysRevenue: todaysRevenue || 0,
        todaysOrders: todaysOrders || 0,
        todaysReturns: todaysReturns || 0,
        todaysRefundAmount: Number(todaysRefundAmount._sum.refundedAmount || 0),
        todaysPurchases: todaysPurchaseCount || 0,
        todaysPurchaseValue: todaysPurchaseValue || 0
      },

      dashboardStats: {
        totalRevenue: totalRevenue || 0,
        netRevenue: totalRevenue || 0,
        grossProfit: netProfit || 0,
        profitMargin: profitMargin || 0,
        totalOrders: totalOrdersData || 0,
        avgOrderValue: avgOrderValue || 0,
        totalExpenses: totalExpenses || 0,
        totalRefunds: Number(totalRefundsData._sum.refundedAmount || 0),
        revenueChange: revenueChange || 0,
        netRevenueChange: revenueChange || 0,
        grossProfitChange: (revenueChange || 0) - (expensesChange || 0),
        ordersChange: ordersChange || 0,
        avgOrderChange: 0,
        expensesChange: expensesChange || 0,
        refundsChange: 0
      },

      financialSummary: {
        totalRevenue: totalRevenue || 0,
        totalExpenses: totalExpenses || 0,
        netProfit: netProfit || 0,
        profitMargin: profitMargin || 0,
        revenueChange: revenueChange || 0,
        expensesChange: expensesChange || 0,
        profitChange: (revenueChange || 0) - (expensesChange || 0)
      },

      revenueByCategoryData: groupedCategories.length > 0 ? groupedCategories : [
        { name: "No Data", value: 0, percentage: 0 }
      ],
      paymentMethodData: paymentMethodData.length > 0 ? paymentMethodData : [
        { method: "CASH", amount: 0, count: 0, percentage: 0 },
        { method: "CARD", amount: 0, count: 0, percentage: 0 }
      ],
      payrollByRoleData: groupedRoles.length > 0 ? groupedRoles : [
        { role: "No Data", totalPaid: 0, employeeCount: 0, averageSalary: 0 }
      ],
      topSellingProducts: topProductsData.length > 0 ? topProductsData : [
        { id: 0, name: "No Products", category: "No Data", quantitySold: 0, revenue: 0, growth: 0 }
      ],
      monthlySalesData: monthlyData.length > 0 ? monthlyData : [
        { month: "Jan 2025", sales: 0, revenue: 0, orders: 0 }
      ],

      inventoryAlerts: {
        expiringProducts: expiringProductsData || [],
        lowStockProducts: lowStockProducts || [],
        outOfStockProducts: outOfStockProducts || []
      },

      inventoryStats: {
        expiringCount: expiringProductsData.length || 0,
        lowStockCount: lowStockProducts.length || 0,
        outOfStockCount: outOfStockProducts.length || 0,
        totalProducts: totalActiveProducts || 0
      }
    };

    console.log("Dashboard data prepared successfully");
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
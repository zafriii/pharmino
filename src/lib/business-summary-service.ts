import prisma from "@/lib/prisma";

export async function getBusinessSummaryData(dateStr: string) {
    // Set up local date boundaries
    const todayStart = new Date(dateStr);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(dateStr);
    todayEnd.setHours(23, 59, 59, 999);

    // Sales data
    const salesData = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
        include: {
            saleItems: {
                include: {
                    item: {
                        include: {
                            category: true,
                        },
                    },
                    batches: {
                        include: {
                            batch: true,
                        },
                    },
                },
            },
            payments: true,
        },
    });

    // Revenue calculation
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalOrders = salesData.length;
    let soldItems: any[] = [];
    const categoryCounts: Record<string, number> = {};

    salesData.forEach((sale) => {
        // Logic from dashboard: PAID or PARTIALLY_REFUNDED contribute to revenue
        if (sale.paymentStatus === "PAID" || sale.paymentStatus === "PARTIALLY_REFUNDED") {
            let actualAmount = Number(sale.grandTotal);
            if (sale.paymentStatus === "PARTIALLY_REFUNDED") {
                const totalRefunded = sale.payments.reduce((sum, p) => sum + (Number(p.refundedAmount) || 0), 0);
                actualAmount = Math.max(0, actualAmount - totalRefunded);
            }
            totalRevenue += actualAmount;
            totalDiscount += Number(sale.discountAmount || 0);

            sale.saleItems.forEach((si) => {
                soldItems.push({
                    name: si.item.itemName,
                    quantity: si.quantity,
                    price: Number(si.totalPrice),
                    unitPrice: Number(si.unitPrice),
                    sellType: si.sellType,
                    batches: si.batches.map(sb => ({
                        batchNumber: sb.batch.batchNumber,
                        quantity: sb.quantity
                    }))
                });

                const catName = si.item.category.name;
                categoryCounts[catName] = (categoryCounts[catName] || 0) + si.quantity;
            });
        }
    });

    // Top Category
    let mostSoldCategory = "N/A";
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostSoldCategory = cat;
        }
    });

    // Group sold items by name and batch for better display
    const summarizedSoldItems: any[] = [];
    const itemMap = new Map<string, any>();

    soldItems.forEach(item => {
        const key = `${item.name}-${JSON.stringify(item.batches)}`;
        if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.quantity += item.quantity;
            existing.price += item.price;
        } else {
            itemMap.set(key, { ...item });
        }
    });
    summarizedSoldItems.push(...itemMap.values());

    // Expenses
    const otherExpenses = await prisma.expense.findMany({
        where: {
            date: new Date(dateStr),
        },
    });
    const totalOtherExpense = otherExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Payroll
    const payrolls = await prisma.payroll.findMany({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
            paymentStatus: "PAID",
        },
        include: {
            user: true,
        },
    });
    const totalPayrollExpense = payrolls.reduce((sum, p) => sum + Number(p.netPay), 0);

    // Received Items (Purchases)
    const receivedItems = await prisma.receivedItem.findMany({
        where: {
            receivedAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
        include: {
            purchaseItem: {
                include: {
                    item: true,
                },
            },
        },
    });
    const totalProductCost = receivedItems.reduce((sum, ri) => sum + (ri.receivedQuantity * Number(ri.purchaseItem.puchasePrice)), 0);

    // Returns and Refunds
    const returns = salesData.filter(s => s.status === "RETURNED").length;
    const totalRefundedAmount = await prisma.payment.aggregate({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd
            },
            status: {
                in: ["REFUNDED", "PARTIALLY_REFUNDED"]
            }
        },
        _sum: {
            refundedAmount: true
        }
    });

    return {
        date: dateStr,
        summary: {
            revenue: {
                totalRevenue,
                totalDiscount,
                totalOrders,
                netRevenue: totalRevenue
            },
            sales: {
                items: summarizedSoldItems,
                mostSoldCategory,
                returns,
                totalRefunded: Number(totalRefundedAmount._sum.refundedAmount || 0)
            },
            expenses: {
                totalExpense: totalOtherExpense + totalPayrollExpense + totalProductCost,
                breakdown: {
                    payroll: totalPayrollExpense,
                    productCost: totalProductCost,
                    others: totalOtherExpense,
                    otherDetails: otherExpenses.map(e => ({ reason: e.reason, amount: Number(e.amount) }))
                },
                payrollDetails: payrolls.map(p => ({ employee: p.user.name, amount: Number(p.netPay) }))
            },
            purchases: {
                receivedItems: receivedItems.map(ri => ({
                    itemName: ri.purchaseItem.item.itemName,
                    quantity: ri.receivedQuantity,
                    cost: ri.receivedQuantity * Number(ri.purchaseItem.puchasePrice)
                }))
            }
        }
    };
}

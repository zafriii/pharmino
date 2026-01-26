import prisma from "@/lib/prisma";

export type SummaryType = "DATE" | "MONTH" | "YEAR" | "RANGE" | "PEAK";

export interface SummaryParams {
    type: SummaryType;
    date?: string; // YYYY-MM-DD
    month?: string; // YYYY-MM
    year?: string; // YYYY
    rangeStart?: string;
    rangeEnd?: string;
    compare?: boolean;
}

export async function getBusinessSummaryData(params: SummaryParams) {
    const { start, end, label, prevStart, prevEnd } = getPeriodBoundaries(params);

    const currentData = await fetchSummaryData(start, end);
    let comparison = null;

    if (params.compare && prevStart && prevEnd) {
        const prevData = await fetchSummaryData(prevStart, prevEnd);
        comparison = generateComparison(currentData, prevData);
    }

    const insights = generateInsights(currentData, comparison);
    const topWorst = analyzeProducts(currentData.sales.items);
    const peakAnalysis = analyzePeakTimes(currentData._rawSales);

    return {
        label,
        period: { start, end },
        summary: currentData.summary,
        sales: {
            ...currentData.sales,
            ...topWorst
        },
        expenses: currentData.expenses,
        purchases: currentData.purchases,
        comparison,
        insights,
        peakAnalysis
    };
}

function getPeriodBoundaries(params: SummaryParams) {
    let start: Date;
    let end: Date;
    let label: string;
    let prevStart: Date | null = null;
    let prevEnd: Date | null = null;

    switch (params.type) {
        case "DATE":
            start = new Date(params.date!);
            start.setHours(0, 0, 0, 0);
            end = new Date(params.date!);
            end.setHours(23, 59, 59, 999);
            label = params.date!;

            prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd = new Date(end);
            prevEnd.setDate(prevEnd.getDate() - 1);
            break;

        case "MONTH":
            const [year, month] = params.month!.split("-").map(Number);
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0, 23, 59, 59, 999);
            label = start.toLocaleString('default', { month: 'long', year: 'numeric' });

            prevStart = new Date(year, month - 2, 1);
            prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
            break;

        case "YEAR":
            const y = Number(params.year);
            start = new Date(y, 0, 1);
            end = new Date(y, 11, 31, 23, 59, 59, 999);
            label = `${y}`;

            prevStart = new Date(y - 1, 0, 1);
            prevEnd = new Date(y - 1, 11, 31, 23, 59, 59, 999);
            break;

        case "RANGE":
        case "PEAK":
            start = new Date(params.rangeStart || params.date || new Date().toISOString());
            start.setHours(0, 0, 0, 0);
            end = new Date(params.rangeEnd || params.date || new Date().toISOString());
            end.setHours(23, 59, 59, 999);
            label = params.type === "PEAK" ? `Peak Analysis: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : `${params.rangeStart} to ${params.rangeEnd}`;

            const diff = end.getTime() - start.getTime();
            prevStart = new Date(start.getTime() - diff - 1);
            prevEnd = new Date(start.getTime() - 1);
            break;

        default:
            throw new Error("Invalid summary type");
    }

    return { start, end, label, prevStart, prevEnd };
}

async function fetchSummaryData(start: Date, end: Date) {
    // Basic date formatting for raw date queries (Expenses table)
    const dateStr = start.toISOString().split('T')[0];

    // Sales data
    const salesData = await prisma.sale.findMany({
        where: {
            createdAt: { gte: start, lte: end },
        },
        include: {
            saleItems: {
                include: {
                    item: { include: { category: true } },
                    batches: { include: { batch: true } },
                },
            },
            payments: true,
        },
    });

    // Aggregations
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalOrders = salesData.length;
    let soldItems: any[] = [];
    const categoryCounts: Record<string, number> = {};
    const categoryRevenueMap: Record<string, number> = {};

    salesData.forEach((sale) => {
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
                categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + Number(si.totalPrice);
            });
        }
    });

    // Top Category by Quantity
    let mostSoldCategory = "N/A";
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostSoldCategory = cat;
        }
    });

    // Top Category by Revenue
    let topRevenueCategory = { name: "N/A", revenue: 0 };
    Object.entries(categoryRevenueMap).forEach(([cat, rev]) => {
        if (rev > topRevenueCategory.revenue) {
            topRevenueCategory = { name: cat, revenue: rev };
        }
    });

    // Group sold items
    const summarizedSoldItems: any[] = [];
    const itemMap = new Map<string, any>();
    soldItems.forEach(item => {
        const key = `${item.name}`;
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
            date: { gte: start, lte: end },
        },
    });
    const totalOtherExpense = otherExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const payrolls = await prisma.payroll.findMany({
        where: {
            createdAt: { gte: start, lte: end },
            paymentStatus: "PAID",
        },
        include: { user: true },
    });
    const totalPayrollExpense = payrolls.reduce((sum, p) => sum + Number(p.netPay), 0);

    const receivedItems = await prisma.receivedItem.findMany({
        where: {
            receivedAt: { gte: start, lte: end },
        },
        include: {
            purchaseItem: { include: { item: true } },
        },
    });
    const totalProductCost = receivedItems.reduce((sum, ri) => sum + (ri.receivedQuantity * Number(ri.purchaseItem.puchasePrice)), 0);

    const totalExpense = totalOtherExpense + totalPayrollExpense + totalProductCost;
    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Returns/Refunds
    const returns = salesData.filter(s => s.status === "RETURNED").length;
    const totalRefundedAmount = await prisma.payment.aggregate({
        where: {
            createdAt: { gte: start, lte: end },
            status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] }
        },
        _sum: { refundedAmount: true }
    });

    return {
        summary: {
            revenue: {
                totalRevenue,
                totalDiscount,
                totalOrders,
                netRevenue: totalRevenue,
                netProfit,
                profitMargin,
                netProfitStatus: netProfit >= 0 ? "PROFIT" : "LOSS"
            }
        },
        sales: {
            items: summarizedSoldItems,
            mostSoldCategory,
            topRevenueCategory,
            returns,
            totalRefunded: Number(totalRefundedAmount._sum.refundedAmount || 0)
        },
        expenses: {
            totalExpense,
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
        },
        _rawSales: salesData
    };
}

function generateComparison(curr: any, prev: any) {
    const calcChange = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : 0;

    return {
        revenue: calcChange(curr.summary.revenue.totalRevenue, prev.summary.revenue.totalRevenue),
        expense: calcChange(curr.expenses.totalExpense, prev.expenses.totalExpense),
        orders: calcChange(curr.summary.revenue.totalOrders, prev.summary.revenue.totalOrders),
        profitMargin: curr.summary.revenue.profitMargin - prev.summary.revenue.profitMargin,
        prevMargin: prev.summary.revenue.profitMargin
    };
}

function generateInsights(curr: any, comp: any) {
    if (!comp && !curr.peakAnalysis) return ["Snapshot generated. Select a comparison view or Peak Analysis for more insights."];

    const insights: string[] = [];

    // Peak Analysis Insight
    if (curr.peakAnalysis) {
        const { bestDay, slowestDay, peakTime } = curr.peakAnalysis;
        insights.push(`⏰ Peak Performance: Your busiest time is usually around ${peakTime}.`);
        insights.push(`🗓️ Weekly Cycle: ${bestDay} is your strongest day, while ${slowestDay} tends to be slower.`);
    }

    if (!comp) return insights.length > 0 ? insights : ["Data analyzed. No significant trends detected."];

    const rev = comp.revenue;
    const exp = comp.expense;

    // Revenue Insight
    if (rev > 0) {
        insights.push(`Sales increased ${rev.toFixed(1)}% compared to the previous period.`);
    } else if (rev < 0) {
        insights.push(`Sales dropped ${Math.abs(rev).toFixed(1)}% compared to the previous period.`);
    }

    // Profit Margin Insight
    if (rev > 0 && comp.profitMargin < 0) {
        insights.push(`Although revenue increased, profit margin dropped from ${comp.prevMargin.toFixed(1)}% → ${curr.summary.revenue.profitMargin.toFixed(1)}% due to higher expenses.`);
    } else if (rev > 0 && comp.profitMargin > 0) {
        insights.push(`Revenue is up, and profit margin improved from ${comp.prevMargin.toFixed(1)}% → ${curr.summary.revenue.profitMargin.toFixed(1)}%. Great job!`);
    }

    // Expense Efficiency
    if (exp > rev && rev > 0) {
        insights.push(`Operational costs (up ${exp.toFixed(1)}%) grew faster than revenue (up ${rev.toFixed(1)}%), impacting net profitability.`);
    }

    // Top Category Insight
    if (curr.sales.topRevenueCategory.name !== "N/A") {
        insights.push(`The "${curr.sales.topRevenueCategory.name}" category was your strongest revenue driver this period, generating ${curr.sales.topRevenueCategory.revenue.toLocaleString()}.`);
    }

    // Motivational Growth Insight
    if (rev > 0) {
        insights.push(`🚀 Keep it up! Your business is growing by ${rev.toFixed(1)}% compared to the last period. Your momentum is excellent!`);
    } else if (rev < 0) {
        insights.push(`📊 Revenue shifted by ${rev.toFixed(1)}% this period. Every business has cycles—focus on your top performers to bounce back stronger!`);
    } else {
        insights.push(`⚖️ Your business remains steady. Let's look for new growth opportunities in the coming days!`);
    }

    return insights;
}

function analyzePeakTimes(sales: any[]) {
    if (!sales || sales.length === 0) return null;

    const dayVolumes: Record<number, number> = {}; // 0-6
    const hourVolumes: Record<number, number> = {}; // 0-23

    sales.forEach(sale => {
        const date = new Date(sale.createdAt);
        const day = date.getDay();
        const hour = date.getHours();

        const amount = Number(sale.grandTotal);
        dayVolumes[day] = (dayVolumes[day] || 0) + amount;
        hourVolumes[hour] = (hourVolumes[hour] || 0) + amount;
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let bestDayIdx = 0;
    let slowestDayIdx = 0;
    let maxDayVol = -1;
    let minDayVol = Infinity;

    for (let i = 0; i < 7; i++) {
        const vol = dayVolumes[i] || 0;
        if (vol > maxDayVol) { maxDayVol = vol; bestDayIdx = i; }
        if (vol < minDayVol) { minDayVol = vol; slowestDayIdx = i; }
    }

    let peakHour = 0;
    let maxHourVol = -1;
    for (let i = 0; i < 24; i++) {
        const vol = hourVolumes[i] || 0;
        if (vol > maxHourVol) { maxHourVol = vol; peakHour = i; }
    }

    return {
        bestDay: days[bestDayIdx],
        slowestDay: days[slowestDayIdx],
        peakTime: `${peakHour}:00 - ${peakHour + 1}:00`,
        peakHour
    };
}

function analyzeProducts(items: any[]) {
    if (items.length === 0) return { topProducts: [], worstProducts: [] };

    const sorted = [...items].sort((a, b) => b.price - a.price);

    return {
        topProducts: sorted.slice(0, 5),
        worstProducts: sorted.filter(i => i.quantity > 0).slice(-5).reverse(),
        topProductRevenue: sorted[0]?.price || 0
    };
}

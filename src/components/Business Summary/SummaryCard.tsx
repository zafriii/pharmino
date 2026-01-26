"use client";

import React from "react";
import { Download, TrendingUp, TrendingDown, ShoppingBag, Layers, Receipt, CreditCard, Package, Users, Info, ArrowUpRight, ArrowDownRight, Minus, Clock, Zap } from "lucide-react";
import { downloadBusinessSummaryPDF } from "@/lib/business-summary-pdf";

interface SummaryCardProps {
    data: any;
}

export function SummaryCard({ data }: SummaryCardProps) {
    const { summary, comparison, insights, label, sales, peakAnalysis } = data;
    const { topProducts, worstProducts, topProductRevenue, topRevenueCategory } = sales;

    return (
        <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-[#4a90e2] to-[#67a7ff] p-5 text-white flex justify-between items-center">
                <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Business Intelligence Report</p>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">{label}</h2>
                        <div className={`px-3 py-0.5 rounded-full text-[10px] font-black tracking-tighter shadow-sm border ${summary.revenue.netProfitStatus === "PROFIT"
                                ? "bg-green-500/20 text-green-100 border-green-400"
                                : "bg-red-500/20 text-red-100 border-red-400"
                            }`}>
                            OVERALL {summary.revenue.netProfitStatus}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => downloadBusinessSummaryPDF(data)}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors flex items-center gap-2 text-sm"
                >
                    <Download size={18} />
                    PDF
                </button>
            </div>

            <div className="p-6 space-y-8">
                {/* Insights Section */}
                {insights && insights.length > 0 && (
                    <section className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-2">
                        <h3 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2 tracking-wider">
                            <Info size={14} /> Intelligence Insights
                        </h3>
                        <div className="space-y-1.5">
                            {insights.map((insight: string, i: number) => (
                                <p key={i} className="text-sm text-gray-700 leading-relaxed font-medium">
                                    • {insight}
                                </p>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatMini
                        icon={<TrendingUp size={16} />}
                        label="Net Revenue"
                        value={summary.revenue.netRevenue}
                        change={comparison?.revenue}
                        color="text-green-600" bg="bg-green-50"
                    />
                    <StatMini
                        icon={<TrendingDown size={16} />}
                        label="Total Expense"
                        value={data.expenses.totalExpense}
                        change={comparison?.expense}
                        color="text-red-600" bg="bg-red-50"
                    />
                    <StatMini
                        icon={<ShoppingBag size={16} />}
                        label="Sales Count"
                        value={summary.revenue.totalOrders}
                        change={comparison?.orders}
                        color="text-blue-600" bg="bg-blue-50"
                    />
                    <StatMini
                        icon={<Layers size={16} />}
                        label="Profit Margin"
                        value={`${(Number(summary.revenue.profitMargin) || 0).toFixed(1)}%`}
                        change={comparison?.profitMargin}
                        isPercentagePoint
                        color="text-purple-600" bg="bg-purple-50"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Revenue Breakdown */}
                    <section className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Receipt size={14} className="text-[#4a90e2]" /> Revenue & Refunds
                        </h3>
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl">
                            <DetailItem label="Gross Sales" value={summary.revenue.totalRevenue} />
                            <DetailItem label="Discounts" value={`-${summary.revenue.totalDiscount}`} color="text-red-500" />
                            <DetailItem label="Total Refunds" value={`-${data.sales.totalRefunded}`} color="text-orange-500" />
                            <div className="pt-2 border-t border-gray-100 space-y-2">
                                <DetailItem label="Top Product Rev" value={topProductRevenue} color="text-blue-600" />
                                <DetailItem label={`Top Category Rev (${topRevenueCategory.name})`} value={topRevenueCategory.revenue} color="text-purple-600" />
                                <div className="pt-1 border-t border-gray-100">
                                    <DetailItem label="Net Revenue" value={summary.revenue.netRevenue} isBold />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Expense Breakdown */}
                    <section className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={14} className="text-red-400" /> Cost Allocation
                        </h3>
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl">
                            <DetailItem label="Payroll (Paid)" value={data.expenses.breakdown.payroll} />
                            <DetailItem label="Inventory Cost" value={data.expenses.breakdown.productCost} />
                            <DetailItem label="Misc Expenses" value={data.expenses.breakdown.others} />
                            <div className="pt-2 border-t border-gray-200">
                                <DetailItem label="Total Outflow" value={data.expenses.totalExpense} isBold />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Product Performance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Top Products */}
                    <section className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-green-500" /> Top Performing
                        </h3>
                        <div className="space-y-2">
                            {topProducts?.map((p: any, i: number) => (
                                <RankingItem key={i} name={p.name} value={p.price} rank={i + 1} color="bg-green-100 text-green-700" />
                            ))}
                        </div>
                    </section>

                    {/* Worst Products */}
                    <section className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ArrowDownRight size={14} className="text-red-500" /> Low Performing
                        </h3>
                        <div className="space-y-2">
                            {worstProducts?.map((p: any, i: number) => (
                                <RankingItem key={i} name={p.name} value={p.price} rank={i + 1} color="bg-red-100 text-red-700" />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Peak Time Analysis Section */}
                {peakAnalysis && (
                    <section className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-orange-500" /> Peak Performance Analysis
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <PeakStat icon={<Zap size={16} className="text-yellow-500" />} label="Peak Time" value={peakAnalysis.peakTime} color="bg-yellow-50" />
                            <PeakStat icon={<TrendingUp size={16} className="text-green-500" />} label="Best Day" value={peakAnalysis.bestDay} color="bg-green-50" />
                            <PeakStat icon={<TrendingDown size={16} className="text-red-500" />} label="Slowest Day" value={peakAnalysis.slowestDay} color="bg-red-50" />
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function PeakStat({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className={`${color} p-4 rounded-2xl flex items-center gap-4`}>
            <div className="bg-white p-2 rounded-xl shadow-sm">
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{label}</p>
                <p className="text-sm font-black text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function StatMini({ icon, label, value, change, isPercentagePoint, color, bg }: { icon: any; label: string; value: any; change?: number; isPercentagePoint?: boolean; color: string; bg: string }) {
    const isUp = (change || 0) > 0;

    return (
        <div className={`${bg} p-3 rounded-2xl flex flex-col justify-between h-24`}>
            <div className="flex justify-between items-start">
                <div className={`${color}`}>{icon}</div>
                {(change !== undefined && change !== 0) && (
                    <div className={`flex items-center text-[10px] font-bold ${isUp ? "text-green-600" : "text-red-600"}`}>
                        {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(change).toFixed(1)}{isPercentagePoint ? "" : "%"}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{label}</p>
                <p className={`text-sm font-bold ${color} truncate`}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
            </div>
        </div>
    );
}

function DetailItem({ label, value, color = "text-gray-700", isBold = false }: { label: string; value: any; color?: string; isBold?: boolean }) {
    return (
        <div className="flex justify-between items-center gap-2">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={`text-sm ${isBold ? "font-bold" : "font-medium"} ${color}`}>
                {typeof value === "number" ? value.toLocaleString() : value}
            </span>
        </div>
    );
}

function RankingItem({ name, value, rank, color }: { name: string; value: number; rank: number; color: string }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full ${color} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                    {rank}
                </span>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{name}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{value.toLocaleString()}</span>
        </div>
    );
}

// "use client";

import React from "react";
import { Download, TrendingUp, TrendingDown, ShoppingBag, Layers, Receipt, CreditCard, Package, Users } from "lucide-react";
import { downloadBusinessSummaryPDF } from "@/lib/business-summary-pdf";

interface SummaryCardProps {
    data: any;
}

export function SummaryCard({ data }: SummaryCardProps) {
    const summary = data.summary;

    return (
        <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-[#4a90e2] to-[#67a7ff] p-5 text-white flex justify-between items-center">
                <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Business Snapshot</p>
                    <h2 className="text-xl font-bold">{data.date}</h2>
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
                {/* Top Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatMini icon={<TrendingUp size={16} />} label="Net Revenue" value={`${summary.revenue.netRevenue.toLocaleString()}`} color="text-green-600" bg="bg-green-50" />
                    <StatMini icon={<TrendingDown size={16} />} label="Total Expense" value={`${summary.expenses.totalExpense.toLocaleString()}`} color="text-red-600" bg="bg-red-50" />
                    <StatMini icon={<ShoppingBag size={16} />} label="Sales" value={summary.revenue.totalOrders} color="text-blue-600" bg="bg-blue-50" />
                    <StatMini icon={<Layers size={16} />} label="Main Category" value={summary.sales.mostSoldCategory} color="text-purple-600" bg="bg-purple-50" />
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Revenue Breakdown */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <Receipt size={16} className="text-[#4a90e2]" /> Financial Breakdown
                        </h3>
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl">
                            <DetailItem label="Gross Sales" value={summary.revenue.totalRevenue} />
                            <DetailItem label="Discounts" value={`-${summary.revenue.totalDiscount}`} color="text-red-500" />
                            <DetailItem label="Refunds" value={`-${summary.sales.totalRefunded}`} color="text-orange-500" />
                            <div className="pt-2 border-t border-gray-200">
                                <DetailItem label="Net Revenue" value={summary.revenue.netRevenue} isBold />
                            </div>
                        </div>
                    </section>

                    {/* Expense Breakdown */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                            <CreditCard size={16} className="text-red-400" /> Expense Breakdown
                        </h3>
                        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl">
                            <DetailItem label="Payroll" value={summary.expenses.breakdown.payroll} />
                            <DetailItem label="Product Cost" value={summary.expenses.breakdown.productCost} />
                            <DetailItem label="Other Expenses" value={summary.expenses.breakdown.others} />
                            <div className="pt-2 border-t border-gray-200">
                                <DetailItem label="Total Expense" value={summary.expenses.totalExpense} isBold />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Lists Section */}
                <div className="space-y-8">
                    {/* Sold Items */}
                    {summary.sales.items.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <Package size={16} className="text-amber-500" /> Top Sold Items
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b border-gray-100">
                                            <th className="pb-2 font-medium">Item Name</th>
                                            <th className="pb-2 font-medium">Qty</th>
                                            <th className="pb-2 font-medium text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {summary.sales.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="group">
                                                <td className="py-3 font-medium text-gray-700">
                                                    {item.name}
                                                    <div className="text-[10px] text-gray-400 flex gap-1 mt-0.5">
                                                        {item.batches.map((b: any) => (
                                                            <span key={b.batchNumber} className="bg-gray-100 px-1.5 rounded">{b.batchNumber} ({b.quantity})</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-gray-500">{item.quantity} {item.sellType}</td>
                                                <td className="py-3 text-right font-semibold text-gray-900">{item.price.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Payroll Detail */}
                    {summary.expenses.payrollDetails.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                                <Users size={16} className="text-indigo-400" /> Payroll Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {summary.expenses.payrollDetails.map((p: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <span className="text-sm text-gray-700">{p.employee}</span>
                                        <span className="font-semibold text-gray-900">{p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatMini({ icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
    return (
        <div className={`${bg} p-3 rounded-2xl space-y-1`}>
            <div className={`${color}`}>{icon}</div>
            <p className="text-[10px] text-gray-500 font-medium uppercase truncate">{label}</p>
            <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
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

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Bot, User, RefreshCw, Send, ChevronRight, BarChart3, PieChart, Activity, SlidersHorizontal, Settings2, Clock } from "lucide-react";
import CustomInput from "@/components/shared ui/CustomInput";
import Button from "@/components/shared ui/Button";
import { SummaryCard } from "./SummaryCard";
import { fetchBusinessSummary } from "@/actions/business-summary.actions";
import { toast } from "react-hot-toast";
import { SummaryType, SummaryParams } from "@/lib/business-summary-service";

interface Message {
    id: string;
    type: "user" | "bot";
    content: string;
    data?: any;
    timestamp: Date;
}

interface BusinessSummaryChatProps {
    initialData?: any;
    initialDate?: string;
}

export default function BusinessSummaryChat({ initialData, initialDate }: BusinessSummaryChatProps) {
    const [messages, setMessages] = useState<Message[]>(() => {
        if (initialData && initialDate) {
            return [{
                id: "initial",
                type: "bot",
                content: `Here is the business summary for ${initialDate}:`,
                data: initialData,
                timestamp: new Date()
            }];
        }
        return [];
    });

    const [mode, setMode] = useState<SummaryType>("DATE");
    const [params, setParams] = useState<Partial<SummaryParams>>({
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().slice(0, 7),
        year: new Date().getFullYear().toString(),
        rangeStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rangeEnd: new Date().toISOString().split('T')[0],
        compare: true
    });

    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFetch = async () => {
        const fetchParams: SummaryParams = {
            type: mode,
            compare: params.compare,
            ...params
        } as SummaryParams;

        let userContent = `Analyze ${mode.toLowerCase()} summary`;
        if (mode === "DATE") userContent = `Summary for ${params.date}`;
        if (mode === "MONTH") userContent = `Summary for ${params.month}`;
        if (mode === "YEAR") userContent = `Summary for ${params.year}`;
        if (mode === "RANGE") userContent = `Summary from ${params.rangeStart} to ${params.rangeEnd}`;
        if (mode === "PEAK") userContent = `Run Peak Time Analysis`;

        const newMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            content: userContent,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setIsLoading(true);

        try {
            const result = await fetchBusinessSummary(fetchParams);

            if (result.success && result.data) {
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: "bot",
                    content: `I've analyzed the data for ${result.data.label}. Highlights below:`,
                    data: result.data,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                throw new Error(result.error || "Failed to fetch");
            }
        } catch (error) {
            toast.error("Failed to fetch summary data");
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                content: "I'm sorry, I couldn't process the summary for that period. Check if the dates are valid.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 h-[calc(100vh-120px)]">
            {/* Sidebar Mode Selector */}
            <div className="w-80 border-r border-gray-100 bg-gray-50/30 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
                        <Settings2 size={16} className="text-[#4a90e2]" /> Analysis Tools
                    </h2>
                    <p className="text-[11px] text-gray-500">Configure your business intelligence view</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Modes */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Mode</p>
                        <ModeButton active={mode === "DATE"} onClick={() => setMode("DATE")} icon={<Calendar size={18} />} label="Specific Day" />
                        <ModeButton active={mode === "MONTH"} onClick={() => setMode("MONTH")} icon={<BarChart3 size={18} />} label="Monthly View" />
                        <ModeButton active={mode === "YEAR"} onClick={() => setMode("YEAR")} icon={<PieChart size={18} />} label="Yearly Summary" />
                        <ModeButton active={mode === "RANGE"} onClick={() => setMode("RANGE")} icon={<Activity size={18} />} label="Custom Range" />
                        <ModeButton active={mode === "PEAK"} onClick={() => setMode("PEAK")} icon={<Clock size={18} />} label="Peak Time Analysis" />
                    </div>

                    {/* Inputs based on mode */}
                    <div className="space-y-4 px-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parameters</p>

                        {mode === "DATE" && (
                            <CustomInput type="date" value={params.date} onChange={e => setParams({ ...params, date: e.target.value })} label="Select Date" />
                        )}
                        {mode === "MONTH" && (
                            <CustomInput type="month" value={params.month} onChange={e => setParams({ ...params, month: e.target.value })} label="Select Month" />
                        )}
                        {mode === "YEAR" && (
                            <CustomInput type="number" min="2020" max="2099" value={params.year} onChange={e => setParams({ ...params, year: e.target.value })} label="Select Year" />
                        )}
                        {(mode === "RANGE" || mode === "PEAK") && (
                            <div className="space-y-3">
                                <CustomInput type="date" value={params.rangeStart} onChange={e => setParams({ ...params, rangeStart: e.target.value })} label="From" />
                                <CustomInput type="date" value={params.rangeEnd} onChange={e => setParams({ ...params, rangeEnd: e.target.value })} label="To" />
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="compare"
                                checked={params.compare}
                                onChange={e => setParams({ ...params, compare: e.target.checked })}
                                className="w-4 h-4 text-[#4a90e2] rounded border-gray-300 focus:ring-[#4a90e2]"
                            />
                            <label htmlFor="compare" className="text-sm text-gray-700 font-medium cursor-pointer">Enable Comparison</label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                    <Button onClick={handleFetch} disabled={isLoading} className="rounded-2xl flex items-center gap-2 shadow-lg shadow-[#4a90e2]/20">
                        <Send size={18} /> Run Analysis
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#4a90e2]/10 rounded-full flex items-center justify-center text-[#4a90e2]">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Intelligence Assistant</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setMessages([])} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                <SlidersHorizontal size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-700">No Analysis Cached</h3>
                                <p className="text-sm text-gray-500 max-w-[250px]">
                                    Use the left panel to configure an analysis period and run the engine.
                                </p>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex gap-4 max-w-[90%] ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.type === "user" ? "bg-[#4a90e2] text-white" : "bg-gray-100 text-[#4a90e2]"}`}>
                                        {msg.type === "user" ? <User size={20} /> : <Bot size={20} />}
                                    </div>

                                    <div className={`space-y-2 ${msg.type === "user" ? "items-end" : "items-start"}`}>
                                        <div className={`px-5 py-3 rounded-2xl text-sm ${msg.type === "user"
                                            ? "bg-[#4a90e2] text-white rounded-tr-none"
                                            : "bg-gray-100 text-gray-800 rounded-tl-none"
                                            } shadow-sm font-medium`}>
                                            {msg.content}
                                        </div>

                                        {msg.data && <SummaryCard data={msg.data} />}

                                        <span className="text-[10px] text-gray-400 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#4a90e2]">
                                    <Bot size={20} />
                                </div>
                                <div className="bg-gray-50 px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
}

function ModeButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                ? "bg-white text-[#4a90e2] shadow-sm ring-1 ring-gray-100 font-bold"
                : "text-gray-500 hover:bg-white hover:text-gray-700"
                }`}
        >
            {icon}
            <span className="text-sm">{label}</span>
            {active && <ChevronRight size={14} className="ml-auto" />}
        </button>
    );
}

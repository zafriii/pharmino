"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Bot, User, RefreshCw, Send } from "lucide-react";
import CustomInput from "@/components/shared ui/CustomInput";
import Button from "@/components/shared ui/Button";
import { SummaryCard } from "./SummaryCard";
import { fetchBusinessSummary } from "@/actions/business-summary.actions";
import { toast } from "react-hot-toast";

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
    const [selectedDate, setSelectedDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFetch = async () => {
        if (!selectedDate) {
            toast.error("Please select a date first");
            return;
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            content: `Show me the business summary for ${selectedDate}`,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setIsLoading(true);

        try {
            const result = await fetchBusinessSummary(selectedDate);

            if (result.success && result.data) {
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: "bot",
                    content: `Here is the business summary for ${selectedDate}:`,
                    data: result.data,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                throw new Error(result.error || "Failed to fetch");
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
            toast.error("Failed to fetch summary data");

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                content: "I'm sorry, I couldn't retrieve the summary for that date. Please try again or check the system logs.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setSelectedDate("");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4a90e2]/10 rounded-full flex items-center justify-center text-[#4a90e2]">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Business Assistant</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([])}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear Chat"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Calendar size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-700">No activity yet</h3>
                            <p className="text-sm text-gray-500 max-w-[250px]">
                                Select a date below to see your business summary and detailed analytics.
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
                            <div className={`flex gap-3 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === "user" ? "bg-[#4a90e2] text-white" : "bg-gray-100 text-[#4a90e2]"}`}>
                                    {msg.type === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                <div className={`space-y-2 ${msg.type === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm ${msg.type === "user"
                                        ? "bg-[#4a90e2] text-white rounded-tr-none shadow-blue-100/50"
                                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                                        } shadow-sm`}>
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#4a90e2]">
                                <Bot size={16} />
                            </div>
                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-[#4a90e2]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <CustomInput
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-12 !bg-white border border-gray-200 focus:border-[#4a90e2]"
                            placeholder="Pick a date..."
                        />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <Button
                        onClick={handleFetch}
                        disabled={isLoading || !selectedDate}
                        className="!w-auto px-6 rounded-full flex items-center gap-2 shadow-lg shadow-[#4a90e2]/20"
                    >
                        <Send size={18} />
                        <span className="hidden sm:inline">Check Summary</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

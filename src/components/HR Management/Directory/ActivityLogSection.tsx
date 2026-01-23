"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared ui/Card";
import { History, Activity } from "lucide-react";
import ActivitylogFilter from "./ActivitylogFilter";
import LocalDate from "@/components/shared ui/LocalDate";

interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
}

interface ActivityLogSectionProps {
    auditLogs: AuditLog[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export default function ActivityLogSection({ auditLogs }: ActivityLogSectionProps) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const filteredLogs = useMemo(() => {
        return auditLogs.filter((log) => {
            if (!startDate && !endDate) return true;

            const logDate = new Date(log.createdAt);
            // Reset hours to compare dates only
            logDate.setHours(0, 0, 0, 0);

            const start = startDate ? new Date(startDate) : null;
            if (start) start.setHours(0, 0, 0, 0);

            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(0, 0, 0, 0);

            if (start && logDate < start) return false;
            if (end && logDate > end) return false;

            return true;
        });
    }, [auditLogs, startDate, endDate]);

    const handleClear = () => {
        setStartDate("");
        setEndDate("");
    };

    return (
        <Card className="bg-white rounded-xl border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-[#4a90e2]" />
                    <CardTitle className="text-xl text-gray-800">Activity Log</CardTitle>
                </div>
                <ActivitylogFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClear={handleClear}
                />
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 shadow-sm"
                            >
                                <div className="flex-shrink-0 mt-1">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {log.action}
                                        </p>
                                        <span className="flex-shrink-0 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wider">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="font-medium text-gray-700">{log.entity}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="font-mono text-xs">{log.entityId}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                <History className="h-6 w-6 text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-900">No activities found</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">
                                {(startDate || endDate) 
                                    ? "No activities match your date filters. Try adjusting them."
                                    : "Activities will appear here once recorded."}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

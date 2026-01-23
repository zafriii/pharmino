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
                <div className="space-y-3">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.slice(0, 10).map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm"
                            >
                                <Activity className="h-5 w-5 text-emerald-600 mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-800">{log.action}</p>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {log.entity} • {log.entityId}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <p>No activity logs found</p>
                            {(startDate || endDate) && (
                                <p className="text-xs mt-1">Try adjusting your date filters</p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

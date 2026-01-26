import React from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import BusinessSummaryChat from "@/components/Business Summary/BusinessSummaryChat";
import { getBusinessSummaryData, SummaryType, SummaryParams } from "@/lib/business-summary-service";

interface PageProps {
    searchParams: Promise<{
        date?: string;
        type?: SummaryType;
        month?: string;
        year?: string;
        rangeStart?: string;
        rangeEnd?: string;
        compare?: string;
    }>;
}

export default async function BusinessSummaryPage({ searchParams }: PageProps) {
    const params = await searchParams;
    let initialData = null;

    if (params.type || params.date) {
        try {
            const fetchParams: SummaryParams = {
                type: params.type || "DATE",
                date: params.date,
                month: params.month,
                year: params.year,
                rangeStart: params.rangeStart,
                rangeEnd: params.rangeEnd,
                compare: params.compare === "true" || !params.compare // Default to true if type provided
            };
            initialData = await getBusinessSummaryData(fetchParams);
        } catch (error) {
            console.error("Server fetch error:", error);
        }
    }

    return (
        <PageContainer title="Business Assistant">
            <BusinessSummaryChat initialData={initialData} initialDate={params.date || params.month || params.year || params.rangeStart} />
        </PageContainer>
    );
}

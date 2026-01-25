import React from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import BusinessSummaryChat from "@/components/Business Summary/BusinessSummaryChat";
import { getBusinessSummaryData } from "@/lib/business-summary-service";

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function BusinessSummaryPage({ searchParams }: PageProps) {
    const { date } = await searchParams;
    let initialData = null;

    if (date) {
        try {
            initialData = await getBusinessSummaryData(date);
        } catch (error) {
            console.error("Server fetch error:", error);
        }
    }

    return (
        <PageContainer title="Business Summary">
            <BusinessSummaryChat initialData={initialData} initialDate={date} />
        </PageContainer>
    );
}

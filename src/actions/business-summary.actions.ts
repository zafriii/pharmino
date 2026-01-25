"use server";

import { getBusinessSummaryData } from "@/lib/business-summary-service";

export async function fetchBusinessSummary(date: string) {
    try {
        const data = await getBusinessSummaryData(date);
        return { success: true, data };
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "Failed to fetch summary" };
    }
}

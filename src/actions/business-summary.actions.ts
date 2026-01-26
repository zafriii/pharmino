"use server";

import { getBusinessSummaryData, SummaryParams } from "@/lib/business-summary-service";

export async function fetchBusinessSummary(params: SummaryParams) {
    try {
        const data = await getBusinessSummaryData(params);
        return { success: true, data };
    } catch (error) {
        console.error("Action Error:", error);
        return { success: false, error: "Failed to fetch summary" };
    }
}

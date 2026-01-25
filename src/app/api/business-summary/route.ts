import { NextResponse, NextRequest } from "next/server";
import { getBusinessSummaryData } from "@/lib/business-summary-service";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        const data = await getBusinessSummaryData(dateStr);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Business Summary API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

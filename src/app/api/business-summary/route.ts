import { NextResponse, NextRequest } from "next/server";
import { getBusinessSummaryData } from "@/lib/business-summary-service";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || undefined;
        const type = (searchParams.get('type') as any) || "DATE";
        const month = searchParams.get('month') || undefined;
        const year = searchParams.get('year') || undefined;
        const rangeStart = searchParams.get('rangeStart') || undefined;
        const rangeEnd = searchParams.get('rangeEnd') || undefined;
        const compare = searchParams.get('compare') === 'true' || searchParams.get('compare') === null;

        if (type === "DATE" && !date) {
            return NextResponse.json({ error: "Date is required for DATE type" }, { status: 400 });
        }

        const data = await getBusinessSummaryData({
            type,
            date,
            month,
            year,
            rangeStart,
            rangeEnd,
            compare
        });
        return NextResponse.json(data);

    } catch (error) {
        console.error("Business Summary API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

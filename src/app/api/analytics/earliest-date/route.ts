import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find earliest date from all profit/loss related sources
    const [earliestSale, earliestExpense, earliestPayroll, earliestReceived] = await Promise.all([
      prisma.sale.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.expense.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
      prisma.payroll.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.receivedItem.findFirst({ orderBy: { receivedAt: 'asc' }, select: { receivedAt: true } })
    ]);

    const dates = [
      earliestSale?.createdAt,
      earliestExpense?.date,
      earliestPayroll?.createdAt,
      earliestReceived?.receivedAt
    ].filter((d): d is Date => !!d);

    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date('2024-01-01');

    return NextResponse.json({
      earliestDate: earliestDate.toISOString()
    });
  } catch (error) {
    console.error("GET Earliest Date Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earliest date" },
      { status: 500 }
    );
  }
}
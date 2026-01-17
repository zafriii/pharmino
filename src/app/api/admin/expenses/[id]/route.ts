import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const expenseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

// PUT - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        reason: validatedData.reason,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PUT Expense Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("DELETE Expense Error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
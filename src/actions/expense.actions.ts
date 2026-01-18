"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// Schema validation
const expenseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// CREATE Expense
export async function createExpenseAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      reason: formData.get("reason") as string,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
    };

    const validatedData = expenseSchema.parse(rawData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create expense");
    }

    revalidatePath("/admin/analytics/profit-loss");
    revalidatePath("/admin/analytics/expenses");
    revalidatePath("/admin/analytics/dashboard-overview");
    revalidatePath("/admin/analytics/profit-loss");

    return {
      success: true,
      message: "Expense added successfully!",
    };
  } catch (error: any) {
    console.error("Create Expense Error:", error);
    return {
      success: false,
      message: "Failed to create expense",
      error: error.message,
    };
  }
}

// UPDATE Expense
export async function updateExpenseAction(
  id: number,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      reason: formData.get("reason") as string,
      amount: Number(formData.get("amount")),
      date: formData.get("date") as string,
    };

    const validatedData = expenseSchema.parse(rawData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update expense");
    }

    revalidatePath("/admin/analytics/profit-loss");
    revalidatePath("/admin/analytics/expenses");
    revalidatePath("/admin/analytics/dashboard-overview");

    return {
      success: true,
      message: "Expense updated successfully!",
    };
  } catch (error: any) {
    console.error("Update Expense Error:", error);
    return {
      success: false,
      message: "Failed to update expense",
      error: error.message,
    };
  }
}

// DELETE Expense
export async function deleteExpenseAction(
  id: number
): Promise<ActionResponse> {
  try {
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete expense");
    }

    revalidatePath("/admin/analytics/profit-loss");
    revalidatePath("/admin/analytics/expenses");
    revalidatePath("/admin/analytics/dashboard-overview");

    return {
      success: true,
      message: "Expense deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Expense Error:", error);
    return {
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    };
  }
}
"use server";

import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/cookie-utils";
import type { Expense } from "@/types/expense.types";

const baseUrl = process.env.BETTER_AUTH_URL;

export async function fetchExpensesForGraph(period: string = 'month'): Promise<Expense[]> {
  try {
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      return [];
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/expenses?period=${period}&limit=1000`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.expenses || [];
  } catch (error) {
    console.error("Fetch Expenses for Graph Error:", error);
    return [];
  }
}

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// Schema validation for payroll updates
const updatePayrollSchema = z.object({
  allowances: z.number().nonnegative("Allowances cannot be negative").optional(),
  deductions: z.number().nonnegative("Deductions cannot be negative").optional(),
  paymentStatus: z.enum(["PENDING", "PAID"]).optional(),
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// UPDATE Payroll
export async function updatePayrollAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      allowances: formData.get("allowances") ? Number(formData.get("allowances")) : undefined,
      deductions: formData.get("deductions") ? Number(formData.get("deductions")) : undefined,
      paymentStatus: formData.get("paymentStatus") as string || undefined,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([_, value]) => value !== undefined)
    );

    const validatedData = updatePayrollSchema.parse(cleanData);

    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/payrolls/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update payroll");
    }

    // Instant cache clear
    // revalidateTag("payrolls");
    revalidatePath("/admin/hr/payroll");

    return {
      success: true,
      message: "Payroll updated successfully!",
    };
  } catch (error: any) {
    console.error("Update Payroll Error:", error);
    return {
      success: false,
      message: "Failed to update payroll",
      error: error.message,
    };
  }
}

// MARK Payroll as PAID
export async function markPayrollPaidAction(
  id: string
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/payrolls/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ paymentStatus: "PAID" }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark payroll as paid");
    }

    // Instant cache clear
    // revalidateTag("payrolls");
    revalidatePath("/admin/hr/payroll");

    return {
      success: true,
      message: "Payroll marked as paid successfully!",
    };
  } catch (error: any) {
    console.error("Mark Payroll Paid Error:", error);
    return {
      success: false,
      message: "Failed to mark payroll as paid",
      error: error.message,
    };
  }
}

// DELETE Payroll
export async function deletePayrollAction(
  id: string
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/payrolls/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete payroll");
    }

    // Instant cache clear
    // revalidateTag("payrolls");
    revalidatePath("/admin/hr/payroll");

    return {
      success: true,
      message: "Payroll deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Payroll Error:", error);
    return {
      success: false,
      message: "Failed to delete payroll",
      error: error.message,
    };
  }
}


// FETCH Employee Payroll Stats
export async function fetchEmployeePayrollStatsAction(
  userId: string
): Promise<{
  success: boolean;
  stats?: any;
  error?: string;
}> {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL;
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/admin/payrolls?userId=${userId}`,
      {
        headers: {
          Cookie: cookieHeader,
        },

        // cache + tag
        next: {
          tags: [`payroll-stats-${userId}`],
          revalidate: 60, 
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch payroll stats");
    }

    const data = await response.json();

    return {
      success: true,
      stats: data.stats, // undefined allowed
    };
  } catch (error: any) {
    console.error("Fetch Payroll Stats Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

const refundPaymentSchema = z.object({
  paymentId: z.number().int().positive(),
  refundAmount: z.number().positive(),
  refundMethod: z.enum(['CASH', 'CARD']),
  refundReason: z.string().min(1, "Refund reason is required")
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// REFUND Payment
export async function refundPaymentAction(
  refundData: any
): Promise<ActionResponse> {
  try {
    const validatedData = refundPaymentSchema.parse(refundData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/payments`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to process refund");
    }

    const result = await response.json();

    // revalidateTag("payments");
    // revalidateTag("sales");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/sale/all-sale");

    return { 
      success: true, 
      message: "Refund processed successfully!",
      data: result.data
    };
  } catch (error: any) {
    console.error("Refund Payment Error:", error);
    return {
      success: false,
      message: "Failed to process refund",
      error: error.message,
    };
  }
}
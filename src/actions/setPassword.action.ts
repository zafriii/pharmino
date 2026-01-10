"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

const baseUrl = process.env.BETTER_AUTH_URL;

// Validation schema
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function setPasswordAction(
  userId: string,
  formData: FormData
) {
  try {
    // Read form input values
    const bodyData = {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    // Optional: Local validation before API call
    const validated = passwordSchema.safeParse(bodyData);

    if (!validated.success) {
      const msg = validated.error.issues?.[0]?.message || "Validation failed";
      return { success: false, message: msg };
    }

    // Get session token for admin authentication
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Call your API route
    const response = await fetch(
      `${baseUrl}/api/admin/employees/${userId}/set-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          password: bodyData.password,
          confirmPassword: bodyData.confirmPassword,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to set password",
      };
    }

    // Revalidate employees list
    // revalidateTag("employees");

    return {
      success: true,
      message: "Password updated successfully!",
    };
  } catch (error: any) {
    console.error("Set Password Error:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}

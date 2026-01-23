"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// Schema validation
const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number is required"),
  // role: z.enum(["ADMIN", "COUNTER", "KITCHEN", "WAITER", "DELIVERY"]),
  role: z.enum(["ADMIN", "DELIVERY", "OWNER", "PHARMACIST", "CASHIER", "STOREKEEPER"]),
  status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]).default("ACTIVE"),
  dutyType: z.enum(["FULL_TIME", "PART_TIME"]),
  shift: z.enum(["DAY", "NIGHT"]),
  joiningDate: z.string().min(1, "Joining date is required"),
  monthlySalary: z.number().positive("Salary must be positive"),
  imageUrl: z.string().url().optional().nullable(),
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// CREATE Employee
export async function createEmployeeAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      status: (formData.get("status") as string) || "ACTIVE",
      dutyType: formData.get("dutyType") as string,
      shift: formData.get("shift") as string,
      joiningDate: formData.get("joiningDate") as string,
      monthlySalary: Number(formData.get("monthlySalary")),
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    const validatedData = employeeSchema.parse(rawData);

    // Cookie - handle both regular and secure cookie names
    const sessionToken = await getSessionToken();

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ...(sessionToken
        //   ? { Cookie: `better-auth.session_token=${sessionToken}` }
        //   : {}),
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create employee");
    }

    // Instant cache clear 
    // revalidateTag("employees");
      revalidatePath("/admin/employees");

    return {
      success: true,
      message: "Employee created successfully!",
    };
  } catch (error: any) {
    console.error("Create Employee Error:", error);
    return {
      success: false,
      message: "Failed to create employee",
      error: error.message,
    };
  }
}

// UPDATE Employee
export async function updateEmployeeAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      status: formData.get("status") as string,
      dutyType: formData.get("dutyType") as string,
      shift: formData.get("shift") as string,
      joiningDate: formData.get("joiningDate") as string,
      monthlySalary: Number(formData.get("monthlySalary")),
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    const validatedData = employeeSchema.parse(rawData);

    // Cookie - handle both regular and secure cookie names
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update employee");
    }

    //  Instant cache clear
    // revalidateTag("employees");
      revalidatePath("/admin/employees");

    return {
      success: true,
      message: "Employee updated successfully!",
    };
  } catch (error: any) {
    console.error("Update Employee Error:", error);
    return {
      success: false,
      message: "Failed to update employee",
      error: error.message,
    };
  }
}

// DELETE Employee
export async function deleteEmployeeAction(
  id: string
): Promise<ActionResponse> {
  try {
    // Cookie - handle both regular and secure cookie names
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/employees/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete employee");
    }

    // Instant cache clear
    // revalidateTag("employees");
      revalidatePath("/admin/employees");

    return {
      success: true,
      message: "Employee deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Employee Error:", error);
    return {
      success: false,
      message: "Failed to delete employee",
      error: error.message,
    };
  }
}
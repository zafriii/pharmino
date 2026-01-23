"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// Schema validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  imageUrl: z.string().url().optional().nullable(),
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// CREATE Category
export async function createCategoryAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    const validatedData = categorySchema.parse(rawData);

    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create category");
    }

    // Instant cache clear 
    // revalidateTag("categories");
    revalidatePath("/admin/product-management/categories");

    return {
      success: true,
      message: "Category created successfully!",
    };
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return {
      success: false,
      message: "Failed to create category",
      error: error.message,
    };
  }
}

// UPDATE Category
export async function updateCategoryAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    const validatedData = categorySchema.parse(rawData);

    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update category");
    }

    //  Instant cache clear
    // revalidateTag("categories");
    revalidatePath("/admin/product-management/categories");

    return {
      success: true,
      message: "Category updated successfully!",
    };
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return {
      success: false,
      message: "Failed to update category",
      error: error.message,
    };
  }
}

// DELETE Category
export async function deleteCategoryAction(
  id: string,
  transferToId?: string
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const url = transferToId 
      ? `${baseUrl}/api/categories/${id}?transferToId=${transferToId}`
      : `${baseUrl}/api/categories/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete category");
    }

    // Instant cache clear
    // revalidateTag("categories");
    revalidatePath("/admin/product-management/categories");

    return {
      success: true,
      message: "Category deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return {
      success: false,
      message: "Failed to delete category",
      error: error.message,
    };
  }
}
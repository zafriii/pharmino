"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// const productSchema = z.object({
//   categoryId: z.number().int().positive("Category ID is required"),
//   itemName: z.string().min(1, "Item name is required"),
//   imageUrl: z.string().url().nullable().optional(),
//   genericName: z.string().nullable().optional(),
//   brand: z.string().nullable().optional(),
//   strength: z.string().nullable().optional(),
//   tabletsPerStrip: z.number().int().positive().nullable().optional(),
//   // baseUnit: z.string().nullable().optional(),
//   baseUnit: z.string().min(1, "Base Unit is required"),
//   rackLocation: z.string().nullable().optional(),
//   lowStockThreshold: z.number().int().min(0).default(0),
//   pricePerUnit: z.number().positive().nullable().optional(),
//   sellingPrice: z.number().positive("Selling price must be positive"),
//   status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
// });


const productSchema = z.object({
  categoryId: z.number().int().positive("Category ID is required"),
  itemName: z.string().min(1, "Item name is required"),
  imageUrl: z.string().url().optional().nullable(),
  genericName: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  tabletsPerStrip: z.number().int().positive().optional().nullable(),
  unitPerBox: z.number().int().positive().optional().nullable(),
  baseUnit: z.string().min(1, "Base Unit is required"),
  rackLocation: z.string().optional().nullable(),
  lowStockThreshold: z.number().int().min(0).default(0),
  pricePerUnit: z.number().positive().optional().nullable(),
  sellingPrice: z.number().positive("Selling price must be positive"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});



type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// Helper to safely parse optional numbers
function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}


// FETCH Categories
export async function fetchCategoriesAction() {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/categories`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

//CREATE PRODUCT
export async function createProductAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      categoryId: Number(formData.get("categoryId")),
      itemName: (formData.get("itemName") as string)?.trim(),
      imageUrl: (formData.get("imageUrl") as string) || null,
      genericName: (formData.get("genericName") as string) || null,
      brand: (formData.get("brand") as string) || null,
      strength: (formData.get("strength") as string) || null,
      tabletsPerStrip: parseOptionalNumber(formData.get("tabletsPerStrip")),
      unitPerBox: parseOptionalNumber(formData.get("unitPerBox")),
      baseUnit: (formData.get("baseUnit") as string) || null,
      rackLocation: (formData.get("rackLocation") as string) || null,
      lowStockThreshold: parseOptionalNumber(formData.get("lowStockThreshold")) ?? 0,
      pricePerUnit: parseOptionalNumber(formData.get("pricePerUnit")),
      sellingPrice: Number(formData.get("sellingPrice")),
      status: (formData.get("status") as string) || "ACTIVE",
    };

    const validatedData = productSchema.parse(rawData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create product");
    }

    // revalidateTag("products");
    revalidatePath("/admin/product-management/products");
    revalidatePath("/admin/purchase/purchase-list");
    revalidatePath("/sale/pos");

    return { success: true, message: "Product created successfully!" };
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return {
      success: false,
      message: "Failed to create product",
      error: error.message,
    };
  }
}

// UPDATE PRODUCT 
export async function updateProductAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      categoryId: Number(formData.get("categoryId")),
      itemName: (formData.get("itemName") as string)?.trim(),
      imageUrl: (formData.get("imageUrl") as string) || null,
      genericName: (formData.get("genericName") as string) || null,
      brand: (formData.get("brand") as string) || null,
      strength: (formData.get("strength") as string) || null,
      tabletsPerStrip: parseOptionalNumber(formData.get("tabletsPerStrip")),
      unitPerBox: parseOptionalNumber(formData.get("unitPerBox")),
      baseUnit: (formData.get("baseUnit") as string) || null,
      rackLocation: (formData.get("rackLocation") as string) || null,
      lowStockThreshold: parseOptionalNumber(formData.get("lowStockThreshold")) ?? 0,
      pricePerUnit: parseOptionalNumber(formData.get("pricePerUnit")),
      sellingPrice: Number(formData.get("sellingPrice")),
      status: (formData.get("status") as string) || "ACTIVE",
    };

    const validatedData = productSchema.parse(rawData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update product");
    }

    // revalidateTag("products");
    revalidatePath("/admin/product-management/products");

    return { success: true, message: "Product updated successfully!" };
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return {
      success: false,
      message: "Failed to update product",
      error: error.message,
    };
  }
}


// DELETE Product
export async function deleteProductAction(
  id: string
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete product");
    }

    // Instant cache clear
    // revalidateTag("products");
    revalidatePath("/admin/product-management/products");

    return {
      success: true,
      message: "Product deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return {
      success: false,
      message: "Failed to delete product",
      error: error.message,
    };
  }
}
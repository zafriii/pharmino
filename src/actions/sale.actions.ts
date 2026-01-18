"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

const saleItemSchema = z.object({
  itemId: z.number().int().positive(),
  sellType: z.enum(['FULL_STRIP', 'SINGLE_TABLET', 'ML']).optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  subtotal: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  grandTotal: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD']),
  items: z.array(saleItemSchema).min(1, "At least one item is required")
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// FETCH Products for Sale (Active products with stock)
export async function fetchProductsForSaleAction() {
  try {
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/products?status=ACTIVE`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      next: { tags: ["products-for-sale"] }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products for sale");
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data?.items || data.items || [],
    };
  } catch (error) {
    console.error("Fetch Products for Sale Error:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch products for sale",
    };
  }
}

// CREATE Sale
export async function createSaleAction(
  saleData: any
): Promise<ActionResponse> {
  try {
    const validatedData = createSaleSchema.parse(saleData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create sale");
    }

    const result = await response.json();

    // revalidateTag("sales");
    // revalidateTag("products-for-sale");
    revalidatePath("/admin/sale/all-sale");
    revalidatePath("/admin/sale/pos");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/payments");

    // Revalidate batches pages for all items in the sale
    validatedData.items.forEach(item => {
      revalidatePath(`/admin/inventory/${item.itemId}/batches`);
    });

    return {
      success: true,
      message: "Sale created successfully!",
      data: result.data
    };
  } catch (error: any) {
    console.error("Create Sale Error:", error);
    return {
      success: false,
      message: "Failed to create sale",
      error: error.message,
    };
  }
}



// RETURN Sale
export async function returnSaleAction(
  saleId: number,
  returnReason: string
): Promise<ActionResponse> {
  try {
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/sales/${saleId}/return`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        returnReason
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to return sale");
    }

    const result = await response.json();

    // revalidateTag("sales");
    // revalidateTag("products-for-sale");
    revalidatePath("/admin/sale/all-sale");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/analytics/dashboard-overview");
    revalidatePath("/admin/analytics/profit-loss");

    // Revalidate batches pages for returned items
    if (result.data?.saleItems) {
      result.data.saleItems.forEach((item: any) => {
        revalidatePath(`/admin/inventory/${item.itemId}/batches`);
      });
    }

    return {
      success: true,
      message: "Sale returned successfully!",
      data: result.data
    };
  } catch (error: any) {
    console.error("Return Sale Error:", error);
    return {
      success: false,
      message: "Failed to return sale",
      error: error.message,
    };
  }
}

// BACK TO INVENTORY - Restore returned sale items to inventory
export async function backToInventoryAction(
  saleId: number
): Promise<ActionResponse> {
  try {
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/sales/${saleId}/back-to-inventory`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to restore items to inventory");
    }

    const result = await response.json();

    // revalidateTag("sales");
    // revalidateTag("products-for-sale");
    revalidatePath("/admin/sale/all-sale");
    revalidatePath("/admin/inventory");

    // Revalidate batches pages for restored items
    if (result.data?.saleItems) {
      result.data.saleItems.forEach((item: any) => {
        revalidatePath(`/admin/inventory/${item.itemId}/batches`);
      });
    }

    return {
      success: true,
      message: "Items successfully restored to inventory!",
      data: result.data
    };
  } catch (error: any) {
    console.error("Back to Inventory Error:", error);
    return {
      success: false,
      message: "Failed to restore items to inventory",
      error: error.message,
    };
  }
}
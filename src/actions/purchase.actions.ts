'use server';

import { revalidateTag, revalidatePath, } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionToken } from '@/lib/cookie-utils';

// Zod Schemas
const purchaseItemSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  supplier: z.string().min(1, "Supplier is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  puchasePrice: z.number().positive("Purchase price must be positive"),
});

const createPurchaseSchema = z.object({
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

//Fetch products for making Purchase list

export async function getProductsForPurchaseAction(): Promise<ActionResponse> {
  try {
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      next: {
        revalidate: 300,
        tags: ["products"],
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result.items || result || [],
    };
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return {
      success: false,
      message: 'Failed to fetch products',
      error: error.message || 'Something went wrong',
    };
  }
}

//Create Purchase list

export async function createPurchaseOrderAction(formData: FormData): Promise<ActionResponse> {
  try {
    const itemsJson = formData.get('items') as string;
    const items = JSON.parse(itemsJson);

    // Validate data with Zod
    const validatedData = createPurchaseSchema.parse({ items });

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create purchase order');
    }

    // revalidateTag('purchases');
    revalidatePath("/admin/purchase/purchase-list");
    
    return {
      success: true,
      message: 'Purchase order created successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        error: error.issues[0].message,
      };
    }
    
    return {
      success: false,
      message: 'Failed to create purchase order',
      error: error.message || 'Something went wrong',
    };
  }
}

//Update Purchase list

export async function updatePurchaseOrderAction(id: string, formData: FormData): Promise<ActionResponse> {
  try {
    const itemsJson = formData.get('items') as string;
    const items = JSON.parse(itemsJson);

    // Validate data with Zod
    const validatedData = createPurchaseSchema.parse({ items });

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/purchases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update purchase order');
    }

    // revalidateTag('purchases');
    revalidatePath("/admin/purchase/purchase-list");
    
    return {
      success: true,
      message: 'Purchase order updated successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Update purchase order error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        error: error.issues[0].message,
      };
    }
    
    return {
      success: false,
      message: 'Failed to update purchase order',
      error: error.message || 'Something went wrong',
    };
  }
}

//Delete Purchase list

export async function deletePurchaseOrderAction(id: string) {
  try {
    // Get authentication cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/purchases/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookieHeader,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to delete purchase order',
      };
    }

    // revalidateTag('purchases');
    revalidatePath("/admin/purchase/purchase-list");
    
    return {
      success: true,
      message: 'Purchase order deleted successfully',
    };
  } catch (error) {
    console.error('Delete purchase order error:', error);
    return {
      success: false,
      error: 'Something went wrong',
    };
  }
}


//Update Purchase Order (PO) Status

export async function updatePurchaseOrderStatusAction(id: string, status: string) {
  try {
    // Get authentication cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/purchases/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update purchase order status',
      };
    }

    // revalidateTag('purchases');
    revalidatePath("/admin/purchase/purchase-list");
    revalidatePath("/admin/purchase/received-products");
    revalidatePath("admin/purchase/purchase-history/ordered-items")
    revalidatePath("admin/purchase/purchase-history/received-items")
    
    return {
      success: true,
      message: `Purchase order marked as ${status.toLowerCase()}`,
      data: result,
    };
  } catch (error) {
    console.error('Update purchase order status error:', error);
    return {
      success: false,
      error: 'Something went wrong',
    };
  }
}
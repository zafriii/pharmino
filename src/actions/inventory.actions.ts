'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionToken } from '@/lib/cookie-utils';

// Schema validation
const stockEntrySchema = z.object({
  receivedItemId: z.number().int().positive().optional().nullable(),
  itemId: z.number().int().positive("Item ID is required"),
  expiryDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  quantity: z.number().int().positive("Quantity must be positive"),
  supplier: z.string().min(1, "Supplier is required"),
});

const inventoryFormSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  expiryDate: z.string().optional(),
});

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

//Add received products to the inventory

export async function addSingleItemToInventoryAction(
  receivedItemId: number, 
  inventoryData: {
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    expiryDate?: string;
  },
  receivedItemData: {
    purchaseItem: {
      itemId: number;
      supplier: string;
    };
  }
): Promise<ActionResponse> {
  try {
    // Validate inventory data with Zod
    const validatedInventoryData = inventoryFormSchema.parse(inventoryData);
    
    // Prepare stock entry data
    const stockEntryData = {
      receivedItemId: receivedItemId,
      itemId: receivedItemData.purchaseItem.itemId,
      expiryDate: validatedInventoryData.expiryDate || null,
      purchasePrice: validatedInventoryData.purchasePrice,
      sellingPrice: validatedInventoryData.sellingPrice,
      quantity: validatedInventoryData.quantity,
      supplier: receivedItemData.purchaseItem.supplier,
    };

    // Validate stock entry data with Zod
    const validatedStockData = stockEntrySchema.parse(stockEntryData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/stock-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedStockData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add item to inventory');
    }

    // Revalidate all relevant paths and tags
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/purchase/received-products');
    revalidatePath('/admin/sale/pos');
    
    // Revalidate batches page for the specific item
    revalidatePath(`/admin/inventory/${validatedStockData.itemId}/batches`);

    return {
      success: true,
      message: 'Item successfully added to inventory',
      data: result,
    };
  } catch (error: any) {
    console.error('Add item to inventory error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        error: error.issues[0].message,
      };
    }
    
    return {
      success: false,
      message: 'Failed to add item to inventory',
      error: error.message || 'Something went wrong',
    };
  }
}
'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionToken } from '@/lib/cookie-utils';

// Schema validation
const damageFormSchema = z.object({
  batchId: z.number().int().positive("Batch ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
});

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

export async function recordDamageAction(
  itemId: number,
  damageData: {
    batchId: number;
    quantity: number;
    reason: string;
  }
): Promise<ActionResponse> {
  try {
    // Validate damage data with Zod
    const validatedData = damageFormSchema.parse(damageData);
    
    // Prepare damage record data
    const damageRecordData = {
      itemId: itemId,
      batchId: validatedData.batchId,
      quantity: validatedData.quantity,
      reason: validatedData.reason,
    };

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/damage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(damageRecordData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to record damage');
    }

    // Revalidate relevant caches
    // revalidateTag('inventory');
    // revalidateTag('batches');
    // revalidateTag('damages');
    // revalidateTag(`item-${itemId}`);
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/damage-records');
    revalidatePath(`/admin/inventory/${itemId}/batches`);
    revalidatePath(`/admin/dashboard-overview`);

    return {
      success: true,
      message: 'Damage recorded successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Record damage error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        error: error.issues[0].message,
      };
    }
    
    return {
      success: false,
      message: 'Failed to record damage',
      error: error.message || 'Something went wrong',
    };
  }
}
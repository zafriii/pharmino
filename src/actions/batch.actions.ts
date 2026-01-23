'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSessionToken } from '@/lib/cookie-utils';

// Schema validation
const batchUpdateSchema = z.object({
  expiryDate: z.string().optional().nullable().transform((str) => str ? new Date(str).toISOString() : null),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'EXPIRED']),
});

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

export async function updateBatchAction(
  batchId: number,
  updateData: {
    expiryDate?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | 'EXPIRED';
  }
): Promise<ActionResponse> {
  try {
    // Validate update data with Zod
    const validatedData = batchUpdateSchema.parse(updateData);

    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/batches/${batchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update batch');
    }

    // Revalidate relevant caches
    // revalidateTag('batches');
    // revalidateTag(`item-${result.batch?.itemId}`);
    revalidatePath('/inventory');
    revalidatePath('/sale/pos');
    
    // Revalidate batches page for the specific item if itemId is available
    if (result.batch?.itemId) {
      revalidatePath(`/inventory/${result.batch.itemId}/batches`);
    }


    return {
      success: true,
      message: result.message || 'Batch updated successfully',
      data: result.batch,
    };
  } catch (error: any) {
    console.error('Update batch error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        error: error.issues[0].message,
      };
    }
    
    return {
      success: false,
      message: 'Failed to update batch',
      error: error.message || 'Something went wrong',
    };
  }
}
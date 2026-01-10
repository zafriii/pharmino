import React from 'react';
import { cookies } from 'next/headers';
import DamageList from './DamageList';
import EmptyState from '@/components/EmptyState';
import { DamageRecord } from '@/types/damage.types';
import { getSessionToken } from '@/lib/cookie-utils';

interface FetchDamagesProps {
  searchParams: {
    page?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  };
}

const baseUrl = process.env.BETTER_AUTH_URL;


async function fetchDamages(
  params: FetchDamagesProps['searchParams']
): Promise<{ damages: DamageRecord[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.itemId && { itemId: params.itemId }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      console.log('No session token found');
      return {
        damages: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/admin/damage?${queryParams}`,
      {
        next: {
          revalidate: 60, // 5 minutes
          tags: ['damages'],
        },
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch damage records: ${response.status}`);
    }

    const result = await response.json();

    return {
      damages: result.damages || [],
      totalPages: result.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error('Fetch Damages Error:', error);
    return {
      damages: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchDamages({
  searchParams,
}: FetchDamagesProps) {
  const { damages, totalPages, currentPage } =
    await fetchDamages(searchParams);

  if (damages.length === 0) {
    return <EmptyState message="No damage records found" />;
  }

  return (
    <DamageList
      damages={damages}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}

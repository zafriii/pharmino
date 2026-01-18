import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/cookie-utils";
import ProfitLossOverview from "./ProfitLossOverview";
import ProfitLossChart from "./ProfitLossChart";
import type { ProfitLossData } from "@/types/expense.types";

interface ProfitLossAnalyticsProps {
  searchParams: {
    period?: string;
    compare?: string;
  };
}

// Fetch profit loss data from API
async function fetchProfitLossData(
  params: ProfitLossAnalyticsProps["searchParams"]
): Promise<ProfitLossData | null> {
  const period = params.period || "week";
  const compare = params.compare === "true";

  const queryParams = new URLSearchParams({
    period,
    ...(compare && { compare: "true" }),
  });

  try {
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log("No session token found");
      return null;
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/admin/analytics/profit-loss?${queryParams}`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        next: {
          revalidate: 60, // No cache for debugging
          tags: ["profit-loss"],
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("API Error Response:", errorText);
      throw new Error(
        `Failed to fetch profit loss data: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as ProfitLossData;
  } catch (error) {
    console.error("Fetch Profit Loss Data Error:", error);
    return null;
  }
}

export default async function ProfitLossAnalytics({
  searchParams,
}: ProfitLossAnalyticsProps) {
  const data = await fetchProfitLossData(searchParams);

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <ProfitLossOverview data={data} />

      {/* Chart */}
      <ProfitLossChart data={data} />
    </div>
  );
}
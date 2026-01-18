import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/cookie-utils";
import TodaysSnapshot from "./TodaysSnapshot";
import DashboardStats from "./DashboardStats";
import FinancialSummary from "./FinancialSummary";
import RevenueByCategoryChart from "./RevenueByCategoryChart";
import PaymentMethodChart from "./PaymentMethodChart";
import PayrollByRoleChart from "./PayrollByRoleChart";
import TopSellingProducts from "./TopSellingProducts";
import MonthlySalesChart from "./MonthlySalesChart";
import InventoryAlerts from "./InventoryAlerts";
import InventoryStats from "./InventoryStats";
import type { DashboardData, DashboardWrapperProps } from "@/types/dashboard.types";

// Fetch dashboard data from API
async function fetchDashboardData(searchParams?: DashboardWrapperProps['searchParams']): Promise<DashboardData | null> {
  try {
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log("No session token found");
      return null;
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (searchParams?.period) {
      queryParams.set('period', searchParams.period);
    }
    if (searchParams?.startDate) {
      queryParams.set('startDate', searchParams.startDate);
    }
    if (searchParams?.endDate) {
      queryParams.set('endDate', searchParams.endDate);
    }

    const queryString = queryParams.toString();
    // console.log("Fetching dashboard data with filters:", queryString);

    const response = await fetch(`${baseUrl}/api/admin/dashboard${queryString ? `?${queryString}` : ''}`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      next: {
        revalidate: 0, // 5 minutes
        tags: ["dashboard"],
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dashboardData = await response.json();
    console.log("Dashboard data received successfully");
    return dashboardData;
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return null;
  }
}

export default async function DashboardWrapper({ searchParams }: DashboardWrapperProps) {
  const data = await fetchDashboardData(searchParams);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <p className="text-xs text-gray-400 mb-4">Check console for more details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Today's Snapshot */}
      <TodaysSnapshot {...data.todaysSnapshot} />

      {/* 8-Box Dashboard Stats */}
      <DashboardStats {...data.dashboardStats} />

      {/* Financial Summary */}
      <FinancialSummary {...data.financialSummary} />

      {/* Inventory Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Overview</h2>
        <InventoryStats {...data.inventoryStats} />
      </div>

      {/* Inventory Alerts Section */}
      <InventoryAlerts {...data.inventoryAlerts} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Category */}
        <RevenueByCategoryChart data={data.revenueByCategoryData} />

        <TopSellingProducts products={data.topSellingProducts} />

        {/* Payment Method Analysis */}
        <PaymentMethodChart data={data.paymentMethodData} />

        {/* Payroll by Role */}
        <PayrollByRoleChart data={data.payrollByRoleData} />
      </div>

      {/* Monthly Sales Chart - Full Width */}
      <MonthlySalesChart data={data.monthlySalesData} />
    </div>
  );
}
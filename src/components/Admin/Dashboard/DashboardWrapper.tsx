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

interface DashboardData {
  todaysSnapshot: {
    todaysRevenue: number;
    todaysOrders: number;
    todaysReturns: number;
    todaysRefundAmount: number;
    todaysPurchases: number;
    todaysPurchaseValue: number;
  };
  dashboardStats: {
    totalRevenue: number;
    netRevenue: number;
    grossProfit: number;
    profitMargin: number;
    totalOrders: number;
    avgOrderValue: number;
    totalExpenses: number;
    totalRefunds: number;
    revenueChange: number;
    netRevenueChange: number;
    grossProfitChange: number;
    ordersChange: number;
    avgOrderChange: number;
    expensesChange: number;
    refundsChange: number;
  };
  financialSummary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    revenueChange: number;
    expensesChange: number;
    profitChange: number;
  };
  revenueByCategoryData: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  paymentMethodData: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  payrollByRoleData: Array<{
    role: string;
    totalPaid: number;
    employeeCount: number;
    averageSalary: number;
  }>;
  topSellingProducts: Array<{
    id: number;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    growth: number;
  }>;
  monthlySalesData: Array<{
    month: string;
    sales: number;
    revenue: number;
    orders: number;
  }>;
  inventoryAlerts: {
    expiringProducts: Array<{
      id: number;
      itemName: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      daysUntilExpiry: number;
    }>;
    lowStockProducts: Array<{
      id: number;
      itemName: string;
      totalQuantity: number;
      lowStockThreshold: number;
      status: 'LOW_STOCK' | 'OUT_OF_STOCK';
    }>;
    outOfStockProducts: Array<{
      id: number;
      itemName: string;
      totalQuantity: number;
      lowStockThreshold: number;
      status: 'LOW_STOCK' | 'OUT_OF_STOCK';
    }>;
  };
  inventoryStats: {
    expiringCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
  };
}

interface DashboardWrapperProps {
  searchParams?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  };
}

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
    const url = `${baseUrl}/api/admin/dashboard${queryString ? `?${queryString}` : ''}`;

    console.log("Fetching dashboard data with filters:", queryString);
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      next: {
        revalidate: 300, // 5 minutes
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
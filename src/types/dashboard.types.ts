// Dashboard Types

export interface TodaysSnapshot {
  todaysRevenue: number;
  todaysOrders: number;
  todaysReturns: number;
  todaysRefundAmount: number;
  todaysPurchases: number;
  todaysPurchaseValue: number;
}

export interface DashboardStats {
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
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

export interface RevenueByCategoryItem {
  name: string;
  value: number;
  percentage: number;
}

export interface PaymentMethodItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PayrollByRoleItem {
  role: string;
  totalPaid: number;
  employeeCount: number;
  averageSalary: number;
}

export interface TopSellingProduct {
  id: number;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  growth: number;
}

export interface MonthlySalesItem {
  month: string;
  sales: number;
  revenue: number;
  orders: number;
}

export interface ExpiringProduct {
  id: number;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysUntilExpiry: number;
}

export interface StockProduct {
  id: number;
  itemName: string;
  totalQuantity: number;
  lowStockThreshold: number;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface InventoryAlerts {
  expiringProducts: ExpiringProduct[];
  lowStockProducts: StockProduct[];
  outOfStockProducts: StockProduct[];
}

export interface InventoryStats {
  expiringCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
}

export interface DashboardData {
  todaysSnapshot: TodaysSnapshot;
  dashboardStats: DashboardStats;
  financialSummary: FinancialSummary;
  revenueByCategoryData: RevenueByCategoryItem[];
  paymentMethodData: PaymentMethodItem[];
  payrollByRoleData: PayrollByRoleItem[];
  topSellingProducts: TopSellingProduct[];
  monthlySalesData: MonthlySalesItem[];
  inventoryAlerts: InventoryAlerts;
  inventoryStats: InventoryStats;
}

export interface DashboardWrapperProps {
  searchParams?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    todayStart?: string;
    todayEnd?: string;
  };
}

// Component Props Interfaces
export interface PaymentMethodChartProps {
  data: PaymentMethodItem[];
}

export interface PayrollByRoleChartProps {
  data: PayrollByRoleItem[];
}

export interface RevenueByCategoryChartProps {
  data: RevenueByCategoryItem[];
}

export interface TopSellingProductsProps {
  products: TopSellingProduct[];
}

export interface InventoryAlertsProps {
  expiringProducts: ExpiringProduct[];
  lowStockProducts: StockProduct[];
  outOfStockProducts: StockProduct[];
}

export interface InventoryStatsProps {
  expiringCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
}
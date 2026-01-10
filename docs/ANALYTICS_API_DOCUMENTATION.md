# Analytics API Documentation

## Overview

The Analytics API provides comprehensive financial reporting and analysis capabilities for the RestroFly restaurant management system. It enables administrators to track revenue, expenses, payroll, and profitability metrics with flexible date-range filtering and time-series grouping options.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [Profit & Loss Analytics](#1-profit--loss-analytics)
   - [Revenue Breakdown](#2-revenue-breakdown)
   - [Expense Breakdown](#3-expense-breakdown)
   - [Dashboard Summary](#4-dashboard-summary)
   - [PDF Export](#5-pdf-export)
3. [Data Models](#data-models)
4. [Frontend Integration Guide](#frontend-integration-guide)
5. [PDF Generation Details](#pdf-generation-details)
6. [Error Handling](#error-handling)

---

## Authentication

**All analytics endpoints require Admin role authentication.**

### Headers Required
```http
Cookie: better-auth.session_token=<session_token>
```

### Authorization
- **Role Required:** `ADMIN`
- **Middleware:** `requireAdmin()`
- **Response on Unauthorized:** 
  - `401 Unauthorized` - No valid session
  - `403 Forbidden` - Valid session but not an admin

---

## API Endpoints

### 1. Profit & Loss Analytics

Provides comprehensive profit and loss analysis with time-series data for visualizing trends over time.

#### Endpoint
```http
GET /api/admin/analytics/profit-loss
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | Yes | - | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | - | End date in YYYY-MM-DD format |
| `groupBy` | string | No | `daily` | Grouping interval: `daily`, `weekly`, or `monthly` |

#### Example Request
```http
GET /api/admin/analytics/profit-loss?startDate=2025-11-01&endDate=2025-11-27&groupBy=daily
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": "45000.00",
      "totalExpenses": "12000.00",
      "totalPayroll": "8000.00",
      "totalRefunds": "500.00",
      "netRevenue": "44500.00",
      "netProfit": "24500.00",
      "profitMargin": "55.06",
      "orderCount": 350,
      "averageOrderValue": "128.57"
    },
    "timeSeries": [
      {
        "date": "2025-11-01",
        "revenue": "1500.00",
        "expenses": "800.00",
        "profit": "700.00"
      },
      {
        "date": "2025-11-02",
        "revenue": "1800.00",
        "expenses": "750.00",
        "profit": "1050.00"
      }
      // ... more data points
    ],
    "metadata": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-27",
      "groupBy": "daily"
    }
  }
}
```

#### Response Fields

**Summary Object:**
- `totalRevenue`: Total revenue from all PAID orders
- `totalExpenses`: Sum of all operational expenses (inventory, utilities, etc.)
- `totalPayroll`: Sum of all PAID employee payrolls
- `totalRefunds`: Total amount refunded to customers
- `netRevenue`: Total revenue minus refunds
- `netProfit`: Net revenue minus total expenses and payroll
- `profitMargin`: (Net profit / Net revenue) × 100
- `orderCount`: Number of completed orders
- `averageOrderValue`: Average revenue per order

**Time Series Array:**
- `date`: Date in YYYY-MM-DD format
- `revenue`: Total revenue for this period
- `expenses`: Total expenses (operational + payroll) for this period
- `profit`: Revenue minus expenses for this period

#### Financial Calculation Logic

```
Total Revenue = SUM(Order.grandTotal WHERE paymentStatus = 'PAID')
Total Refunds = SUM(Payment.refundedAmount WHERE status = 'REFUNDED')
Net Revenue = Total Revenue - Total Refunds

Operational Expenses = SUM(Expense.amount)
Payroll Expenses = SUM(Payroll.netPay WHERE paymentStatus = 'PAID')
Total Costs = Operational Expenses + Payroll Expenses

Net Profit = Net Revenue - Total Costs
Profit Margin = (Net Profit / Net Revenue) × 100
```

#### Use Cases
- Display revenue vs expenses line chart
- Show profit trends over time
- Calculate KPIs for dashboard cards
- Analyze financial performance by period

---

### 2. Revenue Breakdown

Provides detailed breakdown of revenue by order type, payment method, discounts, and top-selling items.

#### Endpoint
```http
GET /api/admin/analytics/revenue-breakdown
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | Yes | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | End date in YYYY-MM-DD format |

#### Example Request
```http
GET /api/admin/analytics/revenue-breakdown?startDate=2025-11-01&endDate=2025-11-27
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "revenueByOrderType": [
      {
        "orderType": "DINE_IN",
        "revenue": "25000.00",
        "orderCount": 180,
        "averageOrderValue": "138.89",
        "percentage": "55.56"
      },
      {
        "orderType": "TAKEAWAY",
        "revenue": "12000.00",
        "orderCount": 120,
        "averageOrderValue": "100.00",
        "percentage": "26.67"
      },
      {
        "orderType": "DELIVERY",
        "revenue": "8000.00",
        "orderCount": 50,
        "averageOrderValue": "160.00",
        "percentage": "17.78"
      }
    ],
    "revenueByPaymentMethod": [
      {
        "method": "CASH",
        "revenue": "28000.00",
        "transactionCount": 220,
        "percentage": "62.22"
      },
      {
        "method": "CARD",
        "revenue": "17000.00",
        "transactionCount": 130,
        "percentage": "37.78"
      }
    ],
    "discountAnalysis": {
      "totalDiscountGiven": "3500.00",
      "totalOrdersWithDiscount": 85,
      "averageDiscountPerOrder": "41.18",
      "discountPercentageOfRevenue": "7.22"
    },
    "serviceChargeAnalysis": {
      "totalServiceCharge": "4500.00",
      "serviceChargePercentageOfRevenue": "10.00"
    },
    "topSellingMenuItems": [
      {
        "menuItemId": 15,
        "menuItemName": "Margherita Pizza",
        "categoryName": "Pizza",
        "revenue": "4500.00",
        "quantitySold": 90,
        "orderCount": 75,
        "percentage": "10.00"
      },
      {
        "menuItemId": 23,
        "menuItemName": "Caesar Salad",
        "categoryName": "Salads",
        "revenue": "3200.00",
        "quantitySold": 80,
        "orderCount": 68,
        "percentage": "7.11"
      }
      // ... up to 10 items
    ],
    "metadata": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-27",
      "totalRevenue": "45000.00"
    }
  }
}
```

#### Response Fields

**Revenue by Order Type:**
- Shows distribution across DINE_IN, TAKEAWAY, and DELIVERY
- Includes order counts and average order values
- Percentage represents share of total revenue

**Revenue by Payment Method:**
- Splits revenue between CASH and CARD payments
- Based on completed payment transactions
- Useful for cash flow analysis

**Discount Analysis:**
- Total discounts given to customers
- Number of orders with applied discounts
- Average discount per discounted order
- Discount as percentage of gross revenue (before discount)

**Service Charge Analysis:**
- Total service charges collected
- Service charge as percentage of net revenue
- Configurable via SystemConfig table

**Top Selling Menu Items:**
- Top 10 items by revenue contribution
- Includes quantity sold and order frequency
- Shows category association
- Percentage of total revenue

#### Use Cases
- Display pie chart of revenue by order type
- Show bar chart of payment method distribution
- Analyze discount effectiveness
- Identify best-selling items for inventory planning
- Create revenue breakdown reports

---

### 3. Expense Breakdown

Provides detailed analysis of operational expenses and payroll costs with categorization and trend data.

#### Endpoint
```http
GET /api/admin/analytics/expense-breakdown
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | string | Yes | - | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | - | End date in YYYY-MM-DD format |
| `groupBy` | string | No | `daily` | Grouping interval: `daily`, `weekly`, or `monthly` |

#### Example Request
```http
GET /api/admin/analytics/expense-breakdown?startDate=2025-11-01&endDate=2025-11-27&groupBy=weekly
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOperationalExpenses": "12000.00",
      "totalPayrollExpenses": "8000.00",
      "totalExpenses": "20000.00",
      "operationalPercentage": "60.00",
      "payrollPercentage": "40.00"
    },
    "expenseCategories": [
      {
        "reason": "Office Supplies",
        "totalAmount": "3500.00",
        "count": 15,
        "percentage": "29.17",
        "averageAmount": "233.33"
      },
      {
        "reason": "Inventory Purchase",
        "totalAmount": "5000.00",
        "count": 8,
        "percentage": "41.67",
        "averageAmount": "625.00"
      },
      {
        "reason": "Utilities",
        "totalAmount": "2500.00",
        "count": 3,
        "percentage": "20.83",
        "averageAmount": "833.33"
      }
      // ... more categories
    ],
    "payrollByEmployee": [
      {
        "userId": "cm3x...",
        "employeeName": "John Doe",
        "employeeRole": "COUNTER",
        "totalPayroll": "2500.00",
        "payrollCount": 1,
        "averagePayroll": "2500.00"
      },
      {
        "userId": "cm3y...",
        "employeeName": "Jane Smith",
        "employeeRole": "KITCHEN",
        "totalPayroll": "3000.00",
        "payrollCount": 1,
        "averagePayroll": "3000.00"
      }
      // ... more employees
    ],
    "payrollByRole": [
      {
        "role": "ADMIN",
        "totalPayroll": "4000.00",
        "employeeCount": 1,
        "averagePayroll": "4000.00",
        "percentage": "50.00"
      },
      {
        "role": "COUNTER",
        "totalPayroll": "2500.00",
        "employeeCount": 2,
        "averagePayroll": "1250.00",
        "percentage": "31.25"
      }
      // ... more roles
    ],
    "expenseTrends": [
      {
        "date": "2025-11-04",
        "operationalExpenses": "800.00",
        "payrollExpenses": "0.00",
        "totalExpenses": "800.00"
      },
      {
        "date": "2025-11-11",
        "operationalExpenses": "950.00",
        "payrollExpenses": "8000.00",
        "totalExpenses": "8950.00"
      }
      // ... more data points
    ],
    "metadata": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-27",
      "groupBy": "weekly"
    }
  }
}
```

#### Response Fields

**Summary:**
- Separates operational expenses from payroll
- Shows percentage distribution between the two

**Expense Categories:**
- Groups operational expenses by `reason` field
- Sorted by total amount (descending)
- Shows frequency and average amount per expense
- Percentage is relative to total operational expenses

**Payroll by Employee:**
- Individual employee payroll totals
- Includes employee name and role
- Shows number of payroll records (useful for multiple payments)
- Sorted by total payroll amount

**Payroll by Role:**
- Aggregates payroll by employee role
- Shows employee count per role
- Average payroll per employee in that role
- Percentage of total payroll expenses

**Expense Trends:**
- Time-series data for visualizing expense patterns
- Separates operational and payroll expenses
- Grouping follows `groupBy` parameter

#### Use Cases
- Display expense breakdown pie chart
- Show payroll distribution by role
- Identify top expense categories for cost reduction
- Visualize expense trends over time
- Monitor payroll costs by department

---

### 4. Dashboard Summary

Provides high-level KPIs and quick stats for the analytics dashboard homepage.

#### Endpoint
```http
GET /api/admin/analytics/dashboard
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | Yes | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | End date in YYYY-MM-DD format |

#### Example Request
```http
GET /api/admin/analytics/dashboard?startDate=2025-11-01&endDate=2025-11-27
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalRevenue": "45000.00",
      "netRevenue": "44500.00",
      "totalRefunds": "500.00",
      "orderCount": 350,
      "averageOrderValue": "128.57",
      "totalExpenses": "20000.00",
      "operationalExpenses": "12000.00",
      "payrollExpenses": "8000.00",
      "grossProfit": "24500.00",
      "profitMargin": "55.06",
      "revenueGrowth": "15.50",
      "expenseGrowth": "8.20",
      "profitGrowth": "22.30",
      "orderGrowth": "12.00"
    },
    "quickStats": {
      "todayRevenue": "1800.00",
      "todayOrders": 15,
      "pendingPayments": 3,
      "activeOrders": 5
    },
    "revenueExpenseComparison": [
      {
        "date": "2025-11-01",
        "revenue": "1500.00",
        "expenses": "800.00",
        "profit": "700.00"
      },
      {
        "date": "2025-11-02",
        "revenue": "1800.00",
        "expenses": "750.00",
        "profit": "1050.00"
      }
      // ... up to 30 days
    ],
    "metadata": {
      "currentPeriod": {
        "startDate": "2025-11-01",
        "endDate": "2025-11-27"
      },
      "previousPeriod": {
        "startDate": "2025-10-05",
        "endDate": "2025-10-31"
      }
    }
  }
}
```

#### Response Fields

**KPIs:**
- All core financial metrics in one response
- Growth percentages compare current period to previous period of equal length
- Positive growth = increase, negative growth = decrease

**Quick Stats:**
- Real-time data for current day
- `todayRevenue`: Revenue from orders completed today
- `todayOrders`: Number of orders completed today
- `pendingPayments`: Orders with PENDING payment status
- `activeOrders`: Orders in ACTIVE, PREPARING, or READY status

**Revenue Expense Comparison:**
- Daily comparison limited to last 30 days for performance
- Useful for line chart visualization
- Shows profit calculation per day

**Metadata:**
- Current period matches request parameters
- Previous period automatically calculated with same duration
- Used for growth percentage calculations

#### Growth Calculation Logic

```javascript
// Example: Revenue Growth
const currentRevenue = 44500.00;
const previousRevenue = 38600.00;
const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
// Result: 15.28%

// If previous period had no revenue, growth = 0
// If current profit is positive but previous was negative, growth may be very large
```

#### Use Cases
- Dashboard homepage with KPI cards
- Quick overview before diving into detailed reports
- Monitor real-time business status
- Track growth trends over time
- Display summary charts

---

### 5. PDF Export

Generates a formatted PDF report containing comprehensive financial analysis for the specified period.

#### Endpoint
```http
POST /api/admin/analytics/export
```

#### Request Body

```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-27"
}
```

#### Headers
```http
Content-Type: application/json
Cookie: better-auth.session_token=<session_token>
```

#### Success Response (200 OK)

**Content-Type:** `application/pdf`  
**Content-Disposition:** `attachment; filename="profit-loss-report-2025-11-01-to-2025-11-27.pdf"`

Returns a binary PDF file that can be downloaded directly.

#### PDF Report Structure

The generated PDF includes:

1. **Header Section**
   - Report title: "Profit & Loss Analysis Report"
   - Date range of the report
   - Generation timestamp

2. **Executive Summary**
   - Total Revenue
   - Total Refunds
   - Net Revenue
   - Operational Expenses
   - Payroll Expenses
   - Total Expenses
   - Gross Profit
   - Profit Margin (%)
   - Total Orders

3. **Revenue Breakdown Table**
   - Order type distribution (DINE_IN, TAKEAWAY, DELIVERY)
   - Revenue per type
   - Order count
   - Average order value

4. **Top Expense Categories Table**
   - Top 10 expense categories
   - Total amount per category
   - Number of expenses
   - Average expense amount

5. **Payroll Summary**
   - Total payroll expenses

6. **Footer**
   - Generation timestamp
   - "RestroFly POS" branding

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "startDate and endDate are required"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Data Models

### Financial Metrics

```typescript
interface ProfitLossSummary {
  totalRevenue: string;        // Decimal as string
  totalExpenses: string;
  totalPayroll: string;
  totalRefunds: string;
  netRevenue: string;
  netProfit: string;
  profitMargin: string;        // Percentage as string
  orderCount: number;
  averageOrderValue: string;
}

interface ProfitLossData {
  date: string;                // YYYY-MM-DD format
  revenue: string;
  expenses: string;
  profit: string;
}
```

### Revenue Analysis

```typescript
interface RevenueByOrderType {
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  revenue: string;
  orderCount: number;
  averageOrderValue: string;
  percentage: string;
}

interface RevenueByPaymentMethod {
  method: "CASH" | "CARD";
  revenue: string;
  transactionCount: number;
  percentage: string;
}

interface DiscountAnalysis {
  totalDiscountGiven: string;
  totalOrdersWithDiscount: number;
  averageDiscountPerOrder: string;
  discountPercentageOfRevenue: string;
}
```

### Expense Analysis

```typescript
interface ExpenseCategory {
  reason: string;
  totalAmount: string;
  count: number;
  percentage: string;
  averageAmount: string;
}

interface PayrollByEmployee {
  userId: string;
  employeeName: string;
  employeeRole: string;
  totalPayroll: string;
  payrollCount: number;
  averagePayroll: string;
}

interface PayrollByRole {
  role: string;
  totalPayroll: string;
  employeeCount: number;
  averagePayroll: string;
  percentage: string;
}
```

---

## Frontend Integration Guide

### 1. Setting Up Date Range Picker

```typescript
import { useState } from 'react';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-11-01',
    endDate: '2025-11-27'
  });

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
  };

  return (
    <div>
      <DateRangePicker 
        onDateChange={handleDateChange}
        initialStart={dateRange.startDate}
        initialEnd={dateRange.endDate}
      />
      {/* ... rest of dashboard */}
    </div>
  );
};
```

### 2. Fetching Profit & Loss Data

```typescript
interface ProfitLossResponse {
  success: boolean;
  data: {
    summary: ProfitLossSummary;
    timeSeries: ProfitLossData[];
    metadata: {
      startDate: string;
      endDate: string;
      groupBy: string;
    };
  };
}

const fetchProfitLoss = async (
  startDate: string,
  endDate: string,
  groupBy: 'daily' | 'weekly' | 'monthly' = 'daily'
) => {
  const response = await fetch(
    `/api/admin/analytics/profit-loss?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
    {
      method: 'GET',
      credentials: 'include', // Important: includes session cookie
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Please log in');
    }
    if (response.status === 403) {
      throw new Error('Forbidden - Admin access required');
    }
    throw new Error('Failed to fetch profit-loss data');
  }

  const data: ProfitLossResponse = await response.json();
  return data.data;
};

// Usage in React component
const ProfitLossChart = () => {
  const [data, setData] = useState<ProfitLossResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchProfitLoss('2025-11-01', '2025-11-27', 'daily');
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Profit & Loss Analysis</h2>
      <KPICards summary={data.summary} />
      <LineChart data={data.timeSeries} />
    </div>
  );
};
```

### 3. Displaying KPI Cards

```typescript
interface KPICardProps {
  title: string;
  value: string;
  prefix?: string;
  suffix?: string;
  trend?: string; // e.g., "+15.5%"
  trendDirection?: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  prefix = '$', 
  suffix = '',
  trend,
  trendDirection 
}) => {
  return (
    <div className="kpi-card">
      <h3>{title}</h3>
      <p className="value">
        {prefix}{parseFloat(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}{suffix}
      </p>
      {trend && (
        <span className={`trend ${trendDirection}`}>
          {trend}
        </span>
      )}
    </div>
  );
};

// Usage
const KPICards = ({ summary }: { summary: ProfitLossSummary }) => {
  return (
    <div className="kpi-grid">
      <KPICard 
        title="Net Revenue" 
        value={summary.netRevenue}
        trend="+15.5%"
        trendDirection="up"
      />
      <KPICard 
        title="Total Expenses" 
        value={summary.totalExpenses}
        trend="+8.2%"
        trendDirection="up"
      />
      <KPICard 
        title="Net Profit" 
        value={summary.netProfit}
        trend="+22.3%"
        trendDirection="up"
      />
      <KPICard 
        title="Profit Margin" 
        value={summary.profitMargin}
        prefix=""
        suffix="%"
      />
    </div>
  );
};
```

### 4. Creating Charts with Recharts

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProfitLossLineChart = ({ data }: { data: ProfitLossData[] }) => {
  // Convert string values to numbers for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.revenue),
    expenses: parseFloat(item.expenses),
    profit: parseFloat(item.profit),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip 
          formatter={(value: number) => `$${value.toFixed(2)}`}
          labelStyle={{ color: '#000' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#10b981" 
          name="Revenue"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#ef4444" 
          name="Expenses"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          stroke="#3b82f6" 
          name="Profit"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 5. Creating Pie Chart for Revenue Breakdown

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const RevenueBreakdownPieChart = ({ data }: { data: RevenueByOrderType[] }) => {
  const chartData = data.map(item => ({
    name: item.orderType.replace('_', ' '),
    value: parseFloat(item.revenue),
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### 6. Exporting PDF Report

```typescript
const exportPDFReport = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch('/api/admin/analytics/export', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, endDate }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-report-${startDate}-to-${endDate}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

// Usage in component
const ExportButton = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportPDFReport('2025-11-01', '2025-11-27');
      // Show success message
      alert('PDF downloaded successfully!');
    } catch (error) {
      // Show error message
      alert('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={loading}
      className="export-btn"
    >
      {loading ? 'Generating PDF...' : 'Export PDF Report'}
    </button>
  );
};
```

### 7. Complete Dashboard Example

```typescript
import { useState, useEffect } from 'react';

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-11-01',
    endDate: '2025-11-27'
  });
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [dashboard, profitLoss, revenue] = await Promise.all([
          fetch(`/api/admin/analytics/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
            credentials: 'include'
          }).then(r => r.json()),
          
          fetch(`/api/admin/analytics/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`, {
            credentials: 'include'
          }).then(r => r.json()),
          
          fetch(`/api/admin/analytics/revenue-breakdown?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
            credentials: 'include'
          }).then(r => r.json())
        ]);

        setDashboardData(dashboard.data);
        setProfitLossData(profitLoss.data);
        setRevenueData(revenue.data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [dateRange, groupBy]);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard">
      {/* Header with controls */}
      <div className="dashboard-header">
        <h1>Loss & Profit Analysis</h1>
        <div className="controls">
          <DateRangePicker 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button onClick={() => exportPDFReport(dateRange.startDate, dateRange.endDate)}>
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <h2>Key Performance Indicators</h2>
        <KPICards 
          summary={profitLossData.summary}
          growth={dashboardData.kpis}
        />
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h2>Revenue vs Expenses Trend</h2>
          <ProfitLossLineChart data={profitLossData.timeSeries} />
        </div>

        <div className="chart-container">
          <h2>Revenue by Order Type</h2>
          <RevenueBreakdownPieChart data={revenueData.revenueByOrderType} />
        </div>
      </div>

      {/* Tables */}
      <div className="tables-section">
        <div className="table-container">
          <h2>Top Selling Items</h2>
          <TopSellingItemsTable items={revenueData.topSellingMenuItems} />
        </div>
      </div>
    </div>
  );
};
```

---

## PDF Generation Details

### Technology Stack

The PDF export feature uses **PDFKit**, a powerful PDF generation library for Node.js that creates PDFs programmatically.

#### Why PDFKit?

1. **Server-Side Generation**: PDFs are generated on the server, ensuring:
   - Consistent formatting across all clients
   - No client-side dependencies
   - Better security (data stays on server)
   - Works regardless of browser

2. **Stream-Based**: Efficient memory usage for large reports

3. **Full Control**: Complete control over layout, styling, and content

### How PDF Generation Works

#### 1. **Request Flow**

```
Client → POST /api/admin/analytics/export → Server
  ↓
Server fetches data from database
  ↓
PDFKit creates PDF document in memory
  ↓
PDF is streamed as binary response
  ↓
Client receives PDF and triggers download
```

#### 2. **Server-Side Process**

```typescript
// Step 1: Create PDF document
const doc = new PDFDocument({ margin: 50 });

// Step 2: Collect PDF chunks as they're generated
const chunks: Buffer[] = [];
doc.on("data", (chunk) => chunks.push(chunk));

// Step 3: Add content to PDF
doc.fontSize(20).text("Report Title");
doc.moveDown();
doc.fontSize(12).text("Content here...");

// Step 4: Finalize PDF
doc.end();

// Step 5: Wait for completion and combine chunks
const pdfBuffer = await new Promise<Buffer>((resolve) => {
  doc.on("end", () => {
    resolve(Buffer.concat(chunks));
  });
});

// Step 6: Return PDF as response
return new NextResponse(pdfBuffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename='report.pdf'"
  }
});
```

#### 3. **PDF Content Structure**

The PDF is built using these PDFKit methods:

```typescript
// Text formatting
doc.fontSize(20);              // Set font size
doc.font("Helvetica-Bold");    // Set font weight
doc.text("Text content", x, y, options);

// Layout
doc.moveDown(2);              // Add vertical spacing
doc.addPage();                // Add new page when needed

// Drawing
doc.moveTo(x1, y1)            // Drawing lines
   .lineTo(x2, y2)
   .stroke();

// Tables (custom implementation)
function addTable(doc, headers, rows, x, y, colWidths) {
  // Draw headers
  // Draw rows
  // Handle pagination
}
```

#### 4. **Data Flow**

```typescript
// Fetch analytics data (same as API endpoints)
const revenueData = await prisma.order.aggregate({...});
const expensesData = await prisma.expense.aggregate({...});
const payrollData = await prisma.payroll.aggregate({...});

// Calculate metrics
const netProfit = netRevenue - totalCosts;
const profitMargin = (netProfit / netRevenue) * 100;

// Format for PDF
const summaryData = [
  ["Total Revenue", formatCurrency(totalRevenue)],
  ["Net Profit", formatCurrency(netProfit)],
  // ... more rows
];

// Add to PDF
addTable(doc, ["Metric", "Value"], summaryData, 50, 100, [300, 200]);
```

### Frontend Integration for PDF Export

#### Option 1: Direct Download (Recommended)

```typescript
const downloadPDF = async (startDate: string, endDate: string) => {
  const response = await fetch('/api/admin/analytics/export', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-${startDate}-to-${endDate}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

#### Option 2: Display in Browser

```typescript
const viewPDF = async (startDate: string, endDate: string) => {
  const response = await fetch('/api/admin/analytics/export', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  // Open in new tab
  window.open(url, '_blank');
  
  // Or display in iframe
  // const iframe = document.createElement('iframe');
  // iframe.src = url;
  // document.body.appendChild(iframe);
};
```

#### Option 3: With Progress Indicator

```typescript
const PDFExportButton = () => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'downloading' | 'complete'>('idle');
  
  const handleExport = async () => {
    try {
      setStatus('generating');
      
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate: '2025-11-01', 
          endDate: '2025-11-27' 
        }),
      });

      if (!response.ok) throw new Error('Export failed');
      
      setStatus('downloading');
      const blob = await response.blob();
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'profit-loss-report.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
      
      setStatus('complete');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('idle');
      alert('Failed to export PDF');
    }
  };

  return (
    <button onClick={handleExport} disabled={status !== 'idle'}>
      {status === 'idle' && 'Export PDF'}
      {status === 'generating' && 'Generating PDF...'}
      {status === 'downloading' && 'Downloading...'}
      {status === 'complete' && '✓ Complete'}
    </button>
  );
};
```

### PDF Customization Options

You can enhance the PDF generation by:

1. **Adding Charts/Graphs**
   - Use libraries like `chart.js` with `canvas` to generate chart images
   - Embed images in PDF using `doc.image(buffer, x, y, options)`

2. **Custom Styling**
   ```typescript
   doc.fontSize(16)
      .fillColor('#10b981')
      .text('Revenue: $45,000', { underline: true });
   ```

3. **Adding Logo**
   ```typescript
   doc.image('path/to/logo.png', 50, 50, { width: 100 });
   ```

4. **Multi-Page Reports**
   ```typescript
   if (doc.y > 700) {
     doc.addPage();
   }
   ```

5. **Conditional Content**
   ```typescript
   if (profitMargin > 0) {
     doc.fillColor('green').text('Profitable Period');
   } else {
     doc.fillColor('red').text('Loss Period');
   }
   ```

---

## Error Handling

### Common Errors

#### 1. Date Validation Errors (400)

```json
{
  "success": false,
  "error": "startDate and endDate are required"
}
```

**Solution:** Always provide both dates in YYYY-MM-DD format.

```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

**Solution:** Ensure dates are properly formatted. Use date libraries like `date-fns`:

```typescript
import { format } from 'date-fns';
const formattedDate = format(new Date(), 'yyyy-MM-dd');
```

```json
{
  "success": false,
  "error": "startDate must be before endDate"
}
```

**Solution:** Validate date range before making API call:

```typescript
if (new Date(startDate) > new Date(endDate)) {
  alert('Start date must be before end date');
  return;
}
```

#### 2. Authentication Errors (401)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Solution:** User is not logged in. Redirect to login page.

```typescript
if (response.status === 401) {
  router.push('/login');
}
```

#### 3. Authorization Errors (403)

```json
{
  "success": false,
  "error": "Forbidden - Admin access required"
}
```

**Solution:** User is logged in but doesn't have admin role. Show appropriate error message.

```typescript
if (response.status === 403) {
  alert('Admin access required to view analytics');
  router.push('/dashboard');
}
```

#### 4. Server Errors (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Solution:** Log error and show user-friendly message. Errors are logged on server for debugging.

### Error Handling Best Practices

```typescript
const fetchAnalytics = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(`/api/admin/analytics/profit-loss?startDate=${startDate}&endDate=${endDate}`, {
      credentials: 'include',
    });

    // Check HTTP status
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to continue');
      }
      if (response.status === 403) {
        throw new Error('Admin access required');
      }
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid request');
      }
      throw new Error('Failed to fetch analytics');
    }

    const data = await response.json();
    
    // Check response structure
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  } catch (error) {
    console.error('Analytics fetch error:', error);
    throw error;
  }
};

// Usage with error display
const MyComponent = () => {
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await fetchAnalytics('2025-11-01', '2025-11-27');
      // Use data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {/* ... rest of component */}
    </div>
  );
};
```

---

## Performance Considerations

### 1. Date Range Limitations

- **Large Date Ranges:** Queries with years of data may be slow
- **Recommendation:** Limit to 1 year maximum, show warning for larger ranges
- **Pagination:** For very large datasets, consider adding pagination to time-series data

### 2. Caching

Consider implementing caching for expensive queries:

```typescript
// Use Next.js unstable_cache
import { unstable_cache } from 'next/cache';

const getCachedAnalytics = unstable_cache(
  async (startDate, endDate) => {
    // Fetch analytics data
    return data;
  },
  ['analytics-cache'],
  { revalidate: 300 } // 5 minutes
);
```

### 3. Database Indexing

Ensure these indexes exist (already included in schema):
- `Order.createdAt`
- `Order.paymentStatus`
- `Expense.expenseDate`
- `Payroll.createdAt`
- `Payment.status`

### 4. Parallel Requests

Load multiple analytics endpoints in parallel:

```typescript
const [profitLoss, revenue, expenses] = await Promise.all([
  fetchProfitLoss(startDate, endDate),
  fetchRevenue(startDate, endDate),
  fetchExpenses(startDate, endDate),
]);
```

---

## Testing

### Example Test Cases

```typescript
// Test 1: Valid request
const response1 = await fetch('/api/admin/analytics/profit-loss?startDate=2025-11-01&endDate=2025-11-27');
expect(response1.status).toBe(200);

// Test 2: Missing parameters
const response2 = await fetch('/api/admin/analytics/profit-loss?startDate=2025-11-01');
expect(response2.status).toBe(400);

// Test 3: Invalid date format
const response3 = await fetch('/api/admin/analytics/profit-loss?startDate=11/01/2025&endDate=11/27/2025');
expect(response3.status).toBe(400);

// Test 4: Unauthorized access
const response4 = await fetch('/api/admin/analytics/profit-loss?startDate=2025-11-01&endDate=2025-11-27');
expect(response4.status).toBe(401);

// Test 5: PDF export
const response5 = await fetch('/api/admin/analytics/export', {
  method: 'POST',
  body: JSON.stringify({ startDate: '2025-11-01', endDate: '2025-11-27' }),
});
expect(response5.headers.get('Content-Type')).toBe('application/pdf');
```

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify date parameters are in correct format
- Ensure user has admin role
- Check database indexes are present
- Review Prisma query performance in development

---

## Changelog

### Version 1.0.0 (November 27, 2025)
- Initial release
- Profit & Loss Analytics endpoint
- Revenue Breakdown endpoint
- Expense Breakdown endpoint
- Dashboard Summary endpoint
- PDF Export functionality
- Support for daily, weekly, and monthly grouping
- Refund tracking and deduction from revenue
- Payroll expense integration
- Period-over-period comparison

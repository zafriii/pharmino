# 💰 Expense Management & Loss Profit Analysis

## Overview

The Expense Management feature provides comprehensive tools for tracking expenses, analyzing profit/loss, and comparing revenue vs expenses over time with an intuitive inline editing interface.

## Features

### 1. **Summary Statistics Dashboard**
- **Total Revenue** (Last 30 days)
- **Total Expenses** (Last 30 days)
- **Net Profit/Loss** (Last 30 days)
- **Profit Margin** percentage
- Real-time updates after expense changes

### 2. **Expense Calculation Table** (Inline Editing)
- **Add Rows**: Click "Add Rows" button to create new expense entries
- **Edit Mode**: New rows start in edit mode with input fields
- **Fields**:
  - Reason/Item (text input)
  - Date (date picker with calendar icon)
  - Expense Amount (number input)
- **Mark Button**: Click to save the expense (changes to Edit button after saving)
- **Edit Button**: Click to re-enter edit mode for saved expenses
- **Delete Button**: Remove expense (with confirmation for saved items)
- **Real-time Total**: Automatically calculates sum of all expenses
- **Compare Button**: Triggers chart refresh to show updated data
- **State Management**: Uses Zustand store for efficient state handling

### 3. **Expense-Revenue Comparison Chart**
- **Thin Bar Design**: Matches the design with slim, elegant bars
- **Filter Options**:
  - **Daily**: Last 7 days view
  - **Monthly**: Last 6 months view
  - **Yearly**: Last 5 years view
- **Date Selector**: Custom date range picker
- **Interactive Tooltips**: Hover to see exact values
- **Color-coded bars**:
  - Green gradient for Revenue
  - Red gradient for Expenses
- **Profit/Loss Calculation**: Shows net profit/loss for each period
- **Responsive Design**: Adapts to different screen sizes

## API Endpoints Used

### Expenses API
- `GET /api/admin/expenses` - Fetch expenses with pagination and search
- `POST /api/admin/expenses` - Create new expense
- `DELETE /api/admin/expenses/:id` - Delete expense

### Analytics API
- `GET /api/admin/analytics/profit-loss` - Get profit/loss data with time series
  - Query params: `startDate`, `endDate`, `groupBy` (daily/weekly/monthly)

## Component Structure

```
src/components/Expense Management/
├── ExpenseSummaryStats.tsx       # Summary cards with key metrics
├── ExpenseCalculationTable.tsx   # Inline editing expense table
└── ExpenseRevenueChart.tsx       # Bar chart with filters

src/app/(dashboard)/(admin dashboard)/admin/expenses/
└── page.tsx                      # Main expense management page

src/stores/
└── expenseStore.ts               # Zustand store for expense state

src/services/
└── fetchExpenses.ts              # Server-side expense fetching
```

## Usage Flow

1. **View Summary**: Admin sees key metrics for last 30 days at the top
2. **Add Expenses**: 
   - Click "Add Rows" button to create new expense entry
   - Fill in Reason/Item, Date, and Amount in input fields
   - Click Mark button (✓) to save the expense
   - Expense appears in saved state with Edit and Delete buttons
3. **Edit Expenses**:
   - Click Edit button on any saved expense
   - Fields become editable again
   - Click Mark button to save changes
4. **Delete Expenses**:
   - Click Delete (X) button on any expense
   - Saved expenses are deleted from database
   - Unsaved rows are removed from table
5. **View Comparison**: 
   - Click "Compare" button to refresh chart
   - Select filter (Daily/Monthly/Yearly)
   - Use date picker for custom date ranges
   - Hover over bars to see exact values

## Design Features

- Clean, modern UI with consistent styling
- Responsive layout (stacks vertically on mobile)
- Real-time calculations and updates
- Loading states for better UX
- Toast notifications for user feedback
- Confirmation modals for destructive actions
- Hover effects and transitions

## Color Scheme

- Primary Green: `#059669` (Revenue, Success)
- Red: `#EF4444` (Expenses, Danger)
- Gray shades for neutral elements
- White backgrounds with subtle shadows

## Data Flow

1. **Initial Load**: 
   - Page fetches existing expenses via Zustand store
   - Expenses populate the table in saved state
2. **Add/Edit Expense**:
   - User clicks Mark button → POST/PUT to `/api/admin/expenses`
   - Zustand store updates local state
   - Row switches to saved state with Edit button
3. **Delete Expense**:
   - User clicks Delete → DELETE to `/api/admin/expenses/:id`
   - Zustand store removes from local state
   - Row disappears from table
4. **Compare/Refresh**:
   - User clicks Compare → Triggers chart refresh
   - Chart fetches from `/api/admin/analytics/profit-loss`
   - Summary stats update automatically

## Future Enhancements

- Export to CSV/PDF
- Date range filters for history
- Expense categories
- Budget tracking
- Recurring expenses
- Multi-currency support
- Advanced analytics (trends, forecasting)

## Access Control

- **Required Role**: ADMIN
- All API endpoints require admin authentication
- Unauthorized access returns 401/403 errors

---

**Created**: December 2024
**Last Updated**: December 2024

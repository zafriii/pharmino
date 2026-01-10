# Expense Management Refactoring

## Overview
Refactored the expense management system from client-side fetching to server-side fetching with proper state management, following the same pattern as payroll and reservations.

## Changes Made

### 1. Created Server-Side Fetch Services

**File**: `src/app/services/fetchExpenses.ts`
- Server-side function to fetch expenses
- Uses cookies for authentication
- Returns expenses with pagination data
- Handles errors gracefully

```typescript
export async function fetchExpensesAPI(params: FetchParams = {}): Promise<ExpensesResponse> {
  // Fetches expenses server-side with authentication
}
```

**File**: `src/app/services/fetchProfitLoss.ts`
- Server-side function to fetch profit/loss analytics
- Fetches summary stats and time series data
- Uses cookies for authentication
- Returns summary and chart data
- Handles errors gracefully

```typescript
export async function fetchProfitLossAPI(params: ProfitLossParams): Promise<ProfitLossResponse> {
  // Fetches profit/loss analytics server-side with authentication
}
```

### 2. Updated Expense Store
**File**: `src/stores/expenseStore.ts`

**Added Types:**
- `SummaryStats` - For summary statistics (revenue, expenses, profit, margin)
- `ChartDataPoint` - For chart data points

**Added Methods:**
- `fetchSummaryStats(startDate, endDate)` - Fetches summary statistics
- `fetchChartData(startDate, endDate, groupBy)` - Fetches chart data

**Benefits:**
- Centralized API calls in the store
- Consistent error handling
- Reusable across components
- Type-safe data structures

### 3. Converted Page to Server Component
**File**: `src/app/(dashboard)/(admin dashboard)/admin/expenses/page.tsx`

**Before:**
- Client component (`'use client'`)
- Fetched data in useEffect
- Client-side only

**After:**
- Server component (async)
- Fetches expenses AND summary stats server-side
- Added `export const dynamic = 'force-dynamic'`
- Uses async searchParams (Next.js 15 pattern)
- Passes initial expenses and stats to client wrapper
- Calculates last 30 days for stats automatically

### 4. Created Client Wrapper Component
**File**: `src/components/Expense Management/ExpensePageClientWrapper.tsx`

**Purpose:**
- Manages client-side state (refresh triggers)
- Sets initial expenses from server
- Passes initial stats to summary component
- Coordinates between child components
- Handles compare button functionality

**Props:**
- `initialExpenses` - Server-fetched expenses
- `totalPages` - Pagination info
- `initialPage` - Current page number
- `initialSearch` - Search query
- `initialStats` - Server-fetched summary statistics

### 5. Updated ExpenseSummaryStats Component
**File**: `src/components/Expense Management/ExpenseSummaryStats.tsx`

**Changes:**
- Accepts `initialStats` prop from server
- Uses server-fetched stats on initial render
- Only fetches client-side when refresh is triggered
- Removed direct axios calls
- Now uses `fetchSummaryStats` from store for refreshes
- Cleaner, more maintainable code

**Before:**
```typescript
const response = await axios.get('/api/admin/analytics/profit-loss', {...});
const summary = response.data.data.summary;
```

**After:**
```typescript
// Initial render uses server-fetched stats
const [stats, setStats] = useState<SummaryStats>(initialStats);

// Only fetch on refresh trigger
useEffect(() => {
  if (refreshTrigger && refreshTrigger > 0) {
    fetchStats();
  }
}, [refreshTrigger]);
```

### 6. Updated ExpenseRevenueChart Component
**File**: `src/components/Expense Management/ExpenseRevenueChart.tsx`

**Changes:**
- Removed direct axios calls
- Now uses `fetchChartData` from store
- Cleaner, more maintainable code
- Type-safe with `ChartDataPoint`

**Before:**
```typescript
const response = await axios.get('/api/admin/analytics/profit-loss', {...});
const timeSeries = response.data.data.timeSeries || [];
const formatted = timeSeries.map(...);
```

**After:**
```typescript
const data = await fetchChartData(startDate, endDate, filter);
```

## Architecture

### Data Flow:

```
Server Component (page.tsx)
  ↓ (fetches data server-side)
fetchExpensesAPI + fetchProfitLossAPI
  ↓ (passes initial data)
ExpensePageClientWrapper
  ↓ (sets in store & passes to children)
useExpenseStore + initialStats
  ↓ (provides data to)
Child Components (Stats, Table, Chart)
```

### Component Hierarchy:

```
ExpensesPage (Server Component)
├── Fetches: expenses (fetchExpensesAPI)
├── Fetches: summary stats (fetchProfitLossAPI)
└── ExpensePageClientWrapper (Client Component)
    ├── ExpenseSummaryStats (Client Component)
    │   ├── Receives: initialStats (server-fetched)
    │   └── Uses: fetchSummaryStats from store (for refresh only)
    ├── ExpenseCalculationTable (Client Component)
    │   └── Uses: expenses, createExpense, updateExpense, deleteExpense from store
    └── ExpenseRevenueChart (Client Component)
        └── Uses: fetchChartData from store
```

## Benefits

### 1. Server-Side Rendering
- ✅ Initial data loads faster
- ✅ Better SEO (if needed)
- ✅ Reduced client-side JavaScript
- ✅ Improved performance

### 2. Centralized State Management
- ✅ All API calls in one place (store)
- ✅ Consistent error handling
- ✅ Easier to maintain
- ✅ Type-safe

### 3. Code Organization
- ✅ Separation of concerns
- ✅ Reusable functions
- ✅ Cleaner components
- ✅ Better testability

### 4. Consistency
- ✅ Follows same pattern as payroll and reservations
- ✅ Consistent with Next.js 15 best practices
- ✅ Predictable behavior

## API Endpoints Used

### 1. Expenses API
- **Endpoint**: `/api/admin/expenses`
- **Method**: GET
- **Purpose**: Fetch expenses list
- **Params**: page, search, startDate, endDate

### 2. Analytics API
- **Endpoint**: `/api/admin/analytics/profit-loss`
- **Method**: GET
- **Purpose**: Fetch profit/loss analytics
- **Params**: startDate, endDate, groupBy

## Store Methods

### Expense Management:
- `setExpenses(expenses)` - Set expenses in store
- `fetchExpenses(params)` - Fetch expenses (client-side)
- `createExpense(expense)` - Create new expense
- `updateExpense(id, data)` - Update expense
- `deleteExpense(id)` - Delete expense

### Analytics:
- `fetchSummaryStats(startDate, endDate)` - Get summary statistics
- `fetchChartData(startDate, endDate, groupBy)` - Get chart data

## Testing

To verify the refactoring works:

1. **Page Load:**
   - Navigate to `/admin/expenses`
   - Verify expenses load immediately (server-side)
   - Check that stats and chart display correctly

2. **Add Expense:**
   - Click "Add Rows" button
   - Fill in expense details
   - Click Mark button
   - Verify expense appears instantly in the list

3. **Edit Expense:**
   - Click Edit button on an expense
   - Modify the values
   - Click Mark button
   - Verify changes appear instantly

4. **Delete Expense:**
   - Click Delete button on an expense
   - Verify expense is removed instantly

5. **Compare Button:**
   - Click "Compare" button
   - Verify stats and chart refresh

6. **Chart Filters:**
   - Test Daily, Monthly, Yearly filters
   - Verify chart updates correctly
   - Test date picker
   - Verify data loads for selected date

7. **Summary Stats:**
   - Verify stats show last 30 days data
   - Check that profit/loss calculations are correct
   - Verify profit margin displays correctly

## Migration Notes

### Breaking Changes:
- None - All existing functionality preserved

### New Features:
- Server-side rendering for initial load
- Centralized API calls in store
- Better error handling
- Type-safe data structures

### Removed:
- Direct axios calls from components
- Duplicate API logic

## Next.js 15 Compatibility

- ✅ Async searchParams
- ✅ Dynamic rendering with `export const dynamic = 'force-dynamic'`
- ✅ Server components for data fetching
- ✅ Client components for interactivity
- ✅ Proper separation of server/client code

## Performance Improvements

1. **Initial Load**: Faster due to server-side rendering
2. **Subsequent Updates**: Instant UI updates with optimistic rendering
3. **Code Splitting**: Better separation of server/client code
4. **Caching**: Can leverage Next.js caching strategies

## Future Enhancements

Possible improvements:
- Add pagination to expense list
- Add search functionality
- Add date range filters
- Add export functionality
- Add expense categories
- Add bulk operations

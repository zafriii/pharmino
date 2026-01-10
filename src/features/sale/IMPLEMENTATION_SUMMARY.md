# Tablet Selling Feature Implementation

## Overview
This implementation adds the ability to sell individual tablets from products that have `tabletsPerStrip` and `pricePerUnit` defined in the database.

## Key Features

### 1. Custom Tablet Selection UI
- **Location**: `TabletSellSection.tsx`
- **Features**:
  - Custom circular checkbox for enabling tablet sales
  - Only appears for products with `tabletsPerStrip` and `pricePerUnit`
  - Input field for specifying number of tablets
  - Shows available tablets and price per tablet

### 2. Enhanced Sale Panel
- **Location**: Updated `SalePanel.tsx`
- **Features**:
  - Integrates `TabletSellSection` for eligible products
  - Handles tablet configuration state
  - Updates quantity display (tablets vs strips)
  - Automatic price calculation for tablet sales

### 3. Tablet-Level Inventory Management
- **Location**: `inventory-tablet.utils.ts`
- **Features**:
  - FIFO deduction at tablet level
  - Proper strip impact calculation
  - Inventory status updates
  - Support for returns

### 4. Price Calculation
- **Location**: `tablet-calculation.utils.ts`
- **Features**:
  - Automatic price calculation based on `pricePerUnit`
  - Available tablet calculation from strips
  - Strip impact analysis for inventory

### 5. API Integration
- **Location**: Updated `sales/route.ts`
- **Features**:
  - Detects `SINGLE_TABLET` sell type
  - Uses tablet-specific inventory deduction
  - Maintains backward compatibility

## Database Schema Usage

### Required Fields
- `Product.tabletsPerStrip`: Number of tablets per strip
- `Product.pricePerUnit`: Price per individual tablet
- `Product.baseUnit`: Must be "TABLET"
- `SaleItem.sellType`: Uses "SINGLE_TABLET" for tablet sales

### Inventory Logic
- Inventory quantities are stored in strips
- Tablet sales deduct appropriate number of strips
- Partial strips are handled correctly
- Example: Selling 2 tablets from 10-tablet strips deducts 1 strip, leaves 8 tablets available

## User Experience

### Workflow
1. User selects a product with tablet capability
2. Product appears in sale panel with tablet section (disabled by default)
3. User checks the circular checkbox to enable tablet sales
4. Input field appears for tablet quantity
5. Price automatically calculates based on `pricePerUnit`
6. Inventory shows available tablets instead of strips
7. Sale processes with `SINGLE_TABLET` sell type

### Visual Indicators
- Circular checkbox (not square) for tablet selection
- Blue background section when tablet mode is enabled
- Clear labeling: "tablets" vs "strips"
- Available quantity shown in appropriate units

## Technical Implementation

### State Management
- `tabletConfigs` state tracks tablet configuration per product
- Integrates with existing `useSaleStore`
- Automatic cleanup on product removal

### Inventory Deduction
- Uses `deductTabletsFromInventory` for tablet sales
- Falls back to regular `deductFromInventory` for strip sales
- Maintains FIFO ordering and batch tracking

### Price Calculation
- `SINGLE_TABLET`: Uses `pricePerUnit * quantity`
- `FULL_STRIP`: Uses `sellingPrice * quantity`
- Automatic recalculation on sell type change

## Backward Compatibility
- Existing strip-based sales continue to work unchanged
- New tablet feature is opt-in via checkbox
- API handles both sale types seamlessly
- No database migrations required

## Error Handling
- Validates tablet availability before sale
- Prevents overselling at tablet level
- Clear error messages for insufficient stock
- Graceful fallback to strip sales if needed
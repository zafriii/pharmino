# Quantity Control Fix for Tablet Sales

## Issue Fixed
The + and - buttons were showing disabled state based on strip quantities instead of tablet quantities when tablet mode was enabled.

## Root Cause
The quantity controls were using separate logic for tablet config mode vs direct sell type mode, causing inconsistent behavior.

## Solution Implemented

### 1. Unified Helper Functions
```typescript
// Determines if item is in tablet mode (either via config or sell type)
const isInTabletMode = (item: SaleItem): boolean => {
  return Boolean(tabletConfigs[item.itemId]?.enabled) || 
         Boolean(item.sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip && item.item?.pricePerUnit);
};

// Gets current quantity regardless of mode
const getCurrentQuantity = (item: SaleItem): number => {
  if (tabletConfigs[item.itemId]?.enabled) {
    return tabletConfigs[item.itemId].quantity;
  }
  return item.quantity;
};

// Gets max quantity for current mode (tablets or strips)
const getMaxQuantityForCurrentMode = (item: SaleItem): number => {
  if (isInTabletMode(item)) {
    return getAvailableTabletsForProduct(item);
  }
  return getMaxQuantityForItem(item);
};
```

### 2. Updated Quantity Controls
- **Before**: Separate logic for tablet config vs sell type
- **After**: Unified logic using helper functions
- **Result**: + button properly disabled when at tablet limit

### 3. Enhanced Sell Type Integration
- Clicking "Tablet" button now properly enables tablet config
- Clicking "Strip" button disables tablet config
- Seamless switching between modes

## Test Scenarios

### Scenario 1: Using Tablet Config (Checkbox)
1. ✅ Enable tablet checkbox
2. ✅ Quantity controls work with tablet units
3. ✅ + button disabled at tablet limit (e.g., 50 tablets)
4. ✅ Stock shows "50 tablets available"

### Scenario 2: Using Sell Type Buttons
1. ✅ Click "Tablet" button
2. ✅ Automatically enables tablet mode
3. ✅ Quantity controls switch to tablet units
4. ✅ + button respects tablet limits

### Scenario 3: Switching Between Modes
1. ✅ Strip → Tablet: Quantity converts properly
2. ✅ Tablet → Strip: Reverts to strip quantities
3. ✅ No inconsistent states

## Key Improvements

### Before Fix:
- ❌ + button based on strip quantities even in tablet mode
- ❌ Inconsistent behavior between config and sell type
- ❌ Could exceed tablet limits

### After Fix:
- ✅ + button respects current mode (tablets vs strips)
- ✅ Consistent behavior across all interaction methods
- ✅ Proper validation for both modes
- ✅ Clear visual feedback for limits

## Example Behavior

**Product**: Paracetamol, 10 tablets/strip, 5 strips available = 50 tablets

**Strip Mode**:
- Quantity: 1, 2, 3, 4, 5 (strips)
- + disabled at 5 strips
- Stock: "Stock: 5"

**Tablet Mode**:
- Quantity: 1, 2, 3... 50 (tablets)
- + disabled at 50 tablets  
- Stock: "50 tablets available"

The fix ensures quantity controls always work with the appropriate units and limits.
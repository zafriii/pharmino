# Sales API Validation Fix for Tablet Sales

## Issue Fixed
**Error**: "Insufficient active stock for Napa Extend. Available in active batches: 1, Required: 2"

## Root Cause
The sales API validation was comparing strips vs tablets incorrectly:
- Available stock: 1 strip
- Requested quantity: 2 tablets
- Validation: `1 strip < 2 tablets` ❌ (comparing different units)

## Problem Analysis
```typescript
// BEFORE (Incorrect)
const activeStock = product.batches.reduce((sum, batch) => sum + batch.quantity, 0); // strips
if (activeStock < item.quantity) { // comparing strips vs tablets
  throw new Error(`Insufficient active stock...`);
}
```

When selling 2 tablets from a product with 10 tablets per strip:
- `activeStock` = 1 (strip)
- `item.quantity` = 2 (tablets)
- Comparison: 1 < 2 ❌ (fails validation incorrectly)

## Solution Implemented
```typescript
// AFTER (Correct)
if (item.sellType === 'SINGLE_TABLET' && product.tabletsPerStrip) {
  // Convert strips to tablets for proper comparison
  const availableTablets = activeStock * product.tabletsPerStrip;
  if (availableTablets < item.quantity) {
    throw new Error(`Insufficient tablets for ${product.itemName}. Available: ${availableTablets} tablets, Required: ${item.quantity} tablets`);
  }
} else {
  // Regular strip/unit validation
  if (activeStock < item.quantity) {
    throw new Error(`Insufficient active stock...`);
  }
}
```

## Test Scenarios

### Scenario 1: Tablet Sale (Fixed)
- **Product**: 1 strip available, 10 tablets per strip
- **Request**: Sell 2 tablets
- **Validation**: 10 tablets available ≥ 2 tablets requested ✅
- **Result**: Sale proceeds successfully

### Scenario 2: Tablet Sale (Insufficient)
- **Product**: 1 strip available, 10 tablets per strip  
- **Request**: Sell 15 tablets
- **Validation**: 10 tablets available < 15 tablets requested ❌
- **Result**: Clear error message about tablet availability

### Scenario 3: Strip Sale (Unchanged)
- **Product**: 1 strip available
- **Request**: Sell 2 strips
- **Validation**: 1 strip available < 2 strips requested ❌
- **Result**: Original error message about strip availability

## Error Messages Improved

### Before:
```
"Insufficient active stock for Napa Extend. Available in active batches: 1, Required: 2"
```
(Confusing - mixing strips and tablets)

### After (Tablet Sales):
```
"Insufficient tablets for Napa Extend. Available: 10 tablets, Required: 15 tablets"
```
(Clear - both values in same unit)

### After (Strip Sales):
```
"Insufficient active stock for Napa Extend. Available in active batches: 1, Required: 2"
```
(Unchanged for non-tablet sales)

## Impact
- ✅ Tablet sales now validate correctly
- ✅ Clear error messages with proper units
- ✅ No impact on existing strip/unit sales
- ✅ Proper inventory deduction still works in transaction
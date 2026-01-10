# Schema Update Required for Tablet Inventory Tracking

## Current Issue
The tablet selling feature works correctly for deduction logic, but the database schema cannot track partial strips. When selling 2 tablets from a 10-tablet strip, the system:

✅ Correctly calculates: 2 tablets → affects 1 strip, 8 tablets remain
❌ Database only tracks whole strips, so it shows 1 strip deducted (10 tablets gone)

## Root Cause
The current schema tracks inventory in whole strips:
- `ProductBatch.quantity` = number of strips
- `Inventory.totalQuantity` = number of strips

But tablet sales need to track:
- How many tablets remain in an opened strip

## Solution Options

### Option 1: Add `remainingTablets` field (Recommended)
Add a field to track remaining tablets in opened strips:

```sql
-- Add to ProductBatch table
ALTER TABLE "ProductBatch" ADD COLUMN "remainingTablets" INTEGER DEFAULT NULL;
```

**Logic:**
- `quantity` = complete strips
- `remainingTablets` = tablets in the last opened strip (0-9 for 10-tablet strips)
- Total available tablets = (quantity * tabletsPerStrip) + remainingTablets

**Example:**
- Initial: 3 strips (30 tablets) → `quantity: 3, remainingTablets: null`
- Sell 2 tablets → `quantity: 2, remainingTablets: 8` (28 tablets total)
- Sell 5 more tablets → `quantity: 2, remainingTablets: 3` (23 tablets total)

### Option 2: Convert to tablet-based inventory
Change the entire inventory system to track tablets instead of strips:

```sql
-- Update existing data
UPDATE "ProductBatch" SET quantity = quantity * (SELECT "tabletsPerStrip" FROM "Product" WHERE id = "ProductBatch"."itemId");
UPDATE "Inventory" SET totalQuantity = totalQuantity * (SELECT "tabletsPerStrip" FROM "Product" WHERE id = "Inventory"."productId");
```

**Pros:** Simpler logic, everything in tablets
**Cons:** Major breaking change, affects all existing code

### Option 3: Workaround (Current Implementation)
Keep current schema but accept limitations:
- Selling tablets always deducts whole strips
- Frontend shows approximate available tablets
- Not accurate for partial strip tracking

## Recommended Implementation

### Step 1: Add Migration
```typescript
// prisma/migrations/add_remaining_tablets.sql
ALTER TABLE "ProductBatch" ADD COLUMN "remainingTablets" INTEGER DEFAULT NULL;
```

### Step 2: Update Tablet Deduction Logic
```typescript
// When selling tablets from a strip:
if (tabletsFromThisBatch < availableTabletsInBatch) {
  // Partial strip usage
  await client.productBatch.update({
    where: { id: batch.id },
    data: { 
      remainingTablets: availableTabletsInBatch - tabletsFromThisBatch 
    }
  });
} else {
  // Complete strip usage
  await client.productBatch.update({
    where: { id: batch.id },
    data: { 
      quantity: newQuantity,
      remainingTablets: null 
    }
  });
}
```

### Step 3: Update Available Calculation
```typescript
// Calculate total available tablets
const totalTablets = batches.reduce((sum, batch) => {
  const completeStripTablets = batch.quantity * tabletsPerStrip;
  const partialStripTablets = batch.remainingTablets || 0;
  return sum + completeStripTablets + partialStripTablets;
}, 0);
```

## Current Status
The tablet selling feature is **functionally working** but **not accurately tracking inventory** due to schema limitations. 

**Immediate options:**
1. Add the `remainingTablets` field (requires migration)
2. Accept current limitation (whole strips deducted)
3. Disable tablet selling until schema is updated

## Test Results
- ✅ Frontend correctly sends tablet quantities
- ✅ API correctly detects tablet sales  
- ✅ Deduction logic correctly calculates strip impact
- ❌ Database cannot track partial strips accurately
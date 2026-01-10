# Migration Instructions for Tablet Inventory Feature

## Step 1: Run Database Migration

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_remaining_tablets

# Or apply the migration manually
npx prisma db push
```

## Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

## Step 3: Test the Feature

### Test Scenario 1: Basic Tablet Sale
1. **Setup**: Product with 10 tablets per strip, 3 strips available (30 tablets)
2. **Action**: Sell 2 tablets using tablet mode
3. **Expected Result**: 
   - Inventory shows: 2 strips + 8 tablets (28 tablets total)
   - Database: `quantity: 2, remainingTablets: 8`

### Test Scenario 2: Multiple Tablet Sales
1. **Setup**: Same product after Test 1 (28 tablets available)
2. **Action**: Sell 5 more tablets
3. **Expected Result**:
   - Inventory shows: 2 strips + 3 tablets (23 tablets total)  
   - Database: `quantity: 2, remainingTablets: 3`

### Test Scenario 3: Complete Strip Usage
1. **Setup**: Same product after Test 2 (23 tablets available)
2. **Action**: Sell 3 tablets (uses up partial strip)
3. **Expected Result**:
   - Inventory shows: 2 strips + 0 tablets (20 tablets total)
   - Database: `quantity: 2, remainingTablets: null`

### Test Scenario 4: Cross-Strip Sale
1. **Setup**: Same product after Test 3 (20 tablets available)
2. **Action**: Sell 15 tablets (1 complete strip + 5 from another)
3. **Expected Result**:
   - Inventory shows: 0 strips + 5 tablets (5 tablets total)
   - Database: `quantity: 0, remainingTablets: 5`

## Step 4: Verify Non-Tablet Products

Ensure products without `tabletsPerStrip` continue to work normally:
- Regular strip/unit sales should be unaffected
- `remainingTablets` should remain `null` for these products

## Database Schema Changes

### Before:
```sql
ProductBatch {
  quantity: 3  -- 3 strips (30 tablets)
}
```

### After:
```sql
ProductBatch {
  quantity: 2,           -- 2 complete strips (20 tablets)
  remainingTablets: 8    -- 8 tablets in opened strip
}
-- Total: 28 tablets available
```

## Key Features

1. **Partial Strip Tracking**: Accurately tracks remaining tablets in opened strips
2. **FIFO Logic**: Uses oldest batches first, including partial strips
3. **Backward Compatible**: Non-tablet products unaffected
4. **Return Support**: Properly handles returns of tablet sales
5. **Performance Optimized**: Indexed queries for tablet operations

## Troubleshooting

### Issue: Migration Fails
```bash
# Reset and retry
npx prisma migrate reset
npx prisma migrate dev --name add_remaining_tablets
```

### Issue: Type Errors
```bash
# Regenerate Prisma client
npx prisma generate
# Restart TypeScript server in your IDE
```

### Issue: Existing Data
The migration is safe for existing data:
- Existing batches will have `remainingTablets: null` (complete strips)
- No data loss or corruption
- Gradual adoption as tablet sales occur
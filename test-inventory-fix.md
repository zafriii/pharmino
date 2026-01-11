# Test Inventory Fix

## How to Test the Sale Return Fix

### 1. Test Sale Return Process:

1. **Make a Sale**:
   - Go to POS and sell some items
   - Note the quantities before sale

2. **Return the Sale**:
   - Go to Sales → All Sales
   - Find your sale and click "Return"
   - Add a return reason

3. **Add Back to Inventory**:
   - After returning, click "Back to Inventory"
   - This should now work without timeout errors

4. **Check Inventory**:
   - Go to Inventory page
   - Verify quantities are updated correctly
   - Available quantity should show only ACTIVE batch quantities
   - Reserved quantity should show INACTIVE batch quantities

### 2. What Should Happen:

**Before Return:**
```
Product: Medicine X
- Batches: 50 strips (ACTIVE)
- Inventory: Available=50, Reserved=0
```

**After Sale (10 strips sold):**
```
Product: Medicine X  
- Batches: 40 strips (ACTIVE)
- Inventory: Available=40, Reserved=0
```

**After Return + Back to Inventory:**
```
Product: Medicine X
- Batches: 50 strips (ACTIVE) 
- Inventory: Available=50, Reserved=0
```

### 3. If Still Getting Errors:

Try the manual sync API:
```
POST /api/admin/inventory/sync
```

This will fix any remaining data inconsistencies.

### 4. Expected Results:

✅ Sale returns work without timeout errors  
✅ Inventory quantities update correctly  
✅ Available vs Reserved quantities are properly separated  
✅ UI shows correct stock levels  

### 5. Troubleshooting:

If you still see issues:
1. Check browser console for errors
2. Check server logs for detailed error messages
3. Try the sync API to fix data inconsistencies
4. Verify your database has the latest schema changes
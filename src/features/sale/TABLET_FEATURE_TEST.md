# Tablet Selling Feature Test Guide

## Test Scenario: Paracetamol Tablets

### Product Setup
- **Product**: Paracetamol 500mg
- **Tablets per Strip**: 10 tablets
- **Price per Strip**: ₹25
- **Price per Tablet**: ₹2.50
- **Available Stock**: 5 strips (50 tablets total)

## Test Cases

### 1. Default Behavior (Strip Sale)
**Steps:**
1. Add Paracetamol to sale
2. Verify default state shows:
   - Quantity: 1 (strip)
   - Price: ₹25.00
   - Stock: "Stock: 5"
   - Tablet section is disabled (unchecked)

**Expected Result:** ✅ Strip-based sale with correct pricing

### 2. Enable Tablet Mode
**Steps:**
1. Click the circular checkbox in tablet section
2. Verify changes:
   - Checkbox becomes blue with white dot
   - Quantity input appears for tablets
   - Default tablet quantity: 1
   - Price updates to: ₹2.50 × 1 tablet = ₹2.50
   - Stock shows: "(50 tablets available)"
   - Main quantity controls now show "Tablets:" label

**Expected Result:** ✅ Tablet mode enabled with correct pricing and stock display

### 3. Tablet Quantity Controls
**Steps:**
1. With tablet mode enabled, test quantity controls:
   - Click + button: Should increase tablet count (1 → 2 → 3...)
   - Click - button: Should decrease tablet count (3 → 2 → 1)
   - Type in input: Should accept tablet quantities (e.g., 15 tablets)
   - Verify price updates: 15 tablets × ₹2.50 = ₹37.50

**Expected Result:** ✅ Quantity controls work with tablet units, not strip units

### 4. Maximum Tablet Validation
**Steps:**
1. Try to set quantity to 51 tablets (more than available)
2. Verify system prevents overselling
3. Try + button when at maximum (50 tablets)
4. Verify + button is disabled

**Expected Result:** ✅ Cannot exceed available tablet count (50 tablets)

### 5. Switch Back to Strip Mode
**Steps:**
1. Uncheck the tablet checkbox
2. Verify changes:
   - Quantity resets to 1 strip
   - Price updates to ₹25.00
   - Stock shows: "Stock: 5"
   - Quantity controls show "Qty:" label

**Expected Result:** ✅ Successfully switches back to strip mode

### 6. Mixed Sale (Strip + Tablet)
**Steps:**
1. Add Paracetamol twice to sale
2. Keep first item as strip sale (1 strip = ₹25)
3. Enable tablet mode for second item (10 tablets = ₹25)
4. Verify both items show correctly in sale panel
5. Confirm sale processes both items correctly

**Expected Result:** ✅ Can sell same product in different units simultaneously

### 7. Inventory Deduction Test
**Steps:**
1. Sell 23 tablets (should affect 3 strips)
2. Check inventory after sale:
   - 3 strips should be deducted from inventory
   - Remaining: 2 strips = 20 tablets available
3. Verify next sale shows correct available tablets (20)

**Expected Result:** ✅ Inventory correctly deducts strips and shows remaining tablets

## Edge Cases

### 8. Product Without Tablet Support
**Steps:**
1. Add product without `tabletsPerStrip` or `pricePerUnit`
2. Verify tablet section does not appear
3. Only regular quantity controls should be visible

**Expected Result:** ✅ Tablet section hidden for non-tablet products

### 9. Zero Tablet Quantity
**Steps:**
1. Enable tablet mode
2. Try to set quantity to 0
3. Verify minimum quantity is enforced (1 tablet)

**Expected Result:** ✅ Minimum 1 tablet enforced

### 10. Sale Clearing
**Steps:**
1. Add products with tablet configurations
2. Clear sale
3. Add same products again
4. Verify tablet configurations are reset

**Expected Result:** ✅ Tablet configs cleared with sale

## API Integration Test

### 11. Sale Creation with Tablets
**Steps:**
1. Create sale with tablet items
2. Verify API request contains:
   - `sellType: "SINGLE_TABLET"`
   - `quantity: [number of tablets]`
   - `unitPrice: [price per tablet]`
3. Check database records match tablet sale

**Expected Result:** ✅ API correctly processes tablet sales

## Visual Verification

### 12. UI Elements
- ✅ Circular checkbox (not square)
- ✅ Blue background when tablet mode enabled
- ✅ Clear labeling: "tablets" vs "strips"
- ✅ Proper price formatting with currency symbol
- ✅ Disabled state for + button when at maximum
- ✅ Responsive layout on different screen sizes

## Performance Test

### 13. Multiple Products
**Steps:**
1. Add 10+ products with tablet capability
2. Enable tablet mode for several items
3. Adjust quantities rapidly
4. Verify UI remains responsive

**Expected Result:** ✅ Smooth performance with multiple tablet configurations
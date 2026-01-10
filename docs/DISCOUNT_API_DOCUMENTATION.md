# DISCOUNT API DOCUMENTATION

## Overview
The Discount API allows administrators to create and manage promotional discounts that can be applied to specific menu items or entire categories. The system automatically calculates discounted prices and applies priority logic when multiple discounts are available.

## ✨ Key Features
- **Two-level discounts**: Item-specific or category-wide
- **Two discount types**: Percentage (%) or Flat amount ($)
- **Priority logic**: Item discounts override category discounts
- **Auto-expiry**: Discounts automatically expire based on `validTo` date
- **Overlap prevention**: Cannot create overlapping active discounts
- **Bulk discount calculation**: Efficient discount retrieval for menu items
- **Frontend integration**: Get menu items with pre-calculated discounted prices

---

## Endpoints

### 1. Create Discount
**POST** `/api/admin/discounts`

Creates a new discount for a menu item or category.

#### Request Body
```json
{
  "type": "PERCENTAGE",           // "PERCENTAGE" or "FLAT"
  "applicableTo": "MENU_ITEM",    // "MENU_ITEM" or "CATEGORY"
  "menuItemId": 1,                // Required if applicableTo is "MENU_ITEM"
  "categoryId": null,             // Required if applicableTo is "CATEGORY"
  "discountValue": 20,            // Percentage value (0-100) or flat amount
  "validFrom": "2025-11-26T00:00:00Z",
  "validTo": "2025-12-31T23:59:59Z"
}
```

#### Validation Rules
- Either `menuItemId` OR `categoryId` must be provided (not both)
- For `PERCENTAGE` type: `discountValue` must be between 0-100
- For `FLAT` type: `discountValue` must be greater than 0
- `validTo` must be after `validFrom`
- No overlapping active discounts for the same item/category

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "PERCENTAGE",
    "applicableTo": "MENU_ITEM",
    "menuItemId": 1,
    "categoryId": null,
    "discountValue": "20.00",
    "validFrom": "2025-11-26T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "status": "ACTIVE",
    "createdBy": "user-id-123",
    "menuItem": {
      "id": 1,
      "name": "Margherita Pizza",
      "imageUrl": "/images/pizza.jpg",
      "basePrice": "12.99"
    },
    "category": null
  }
}
```

#### Error Responses
- `400 Bad Request`: Invalid data or validation errors
- `404 Not Found`: Menu item or category not found
- `409 Conflict`: Overlapping discount exists

---

### 2. Get All Discounts
**GET** `/api/admin/discounts`

Retrieves all discounts with optional filters.

#### Query Parameters
- `applicableTo` (optional): Filter by "MENU_ITEM" or "CATEGORY"
- `status` (optional): Filter by "ACTIVE" or "EXPIRED"
- `categoryId` (optional): Filter by category ID
- `menuItemId` (optional): Filter by menu item ID
- `search` (optional): Search in menu item or category names

#### Examples
```
GET /api/admin/discounts
GET /api/admin/discounts?status=ACTIVE
GET /api/admin/discounts?applicableTo=CATEGORY
GET /api/admin/discounts?search=pizza
GET /api/admin/discounts?categoryId=2&status=ACTIVE
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "PERCENTAGE",
      "applicableTo": "MENU_ITEM",
      "itemName": "Margherita Pizza",
      "image": "/images/pizza.jpg",
      "categoryName": "Pizzas",
      "originalPrice": 12.99,
      "discountType": "PERCENTAGE",
      "discountValue": 20,
      "discountedPrice": 10.39,
      "validFrom": "2025-11-26T00:00:00.000Z",
      "validTo": "2025-12-31T23:59:59.000Z",
      "status": "ACTIVE",
      "createdBy": {
        "id": "user-id-123",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2025-11-26T10:00:00.000Z",
      "updatedAt": "2025-11-26T10:00:00.000Z"
    },
    {
      "id": 2,
      "type": "FLAT",
      "applicableTo": "CATEGORY",
      "itemName": "Beverages",
      "image": "/images/beverages.jpg",
      "categoryName": "Beverages",
      "originalPrice": null,
      "discountType": "FLAT",
      "discountValue": 2,
      "discountedPrice": null,
      "validFrom": "2025-11-26T00:00:00.000Z",
      "validTo": "2025-12-31T23:59:59.000Z",
      "status": "ACTIVE",
      "createdBy": {
        "id": "user-id-123",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2025-11-26T11:00:00.000Z",
      "updatedAt": "2025-11-26T11:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Discount
**GET** `/api/admin/discounts/:id`

Retrieves details of a specific discount.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "PERCENTAGE",
    "applicableTo": "MENU_ITEM",
    "menuItemId": 1,
    "categoryId": null,
    "menuItem": {
      "id": 1,
      "name": "Margherita Pizza",
      "imageUrl": "/images/pizza.jpg",
      "basePrice": "12.99",
      "category": {
        "id": 1,
        "name": "Pizzas"
      }
    },
    "category": null,
    "originalPrice": 12.99,
    "discountValue": 20,
    "discountedPrice": 10.39,
    "validFrom": "2025-11-26T00:00:00.000Z",
    "validTo": "2025-12-31T23:59:59.000Z",
    "status": "ACTIVE",
    "createdBy": {
      "id": "user-id-123",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-11-26T10:00:00.000Z",
    "updatedAt": "2025-11-26T10:00:00.000Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: Invalid ID
- `404 Not Found`: Discount not found

---

### 4. Update Discount
**PUT** `/api/admin/discounts/:id`

Updates an existing discount. All fields are optional.

#### Request Body
```json
{
  "type": "FLAT",                 // Optional: "PERCENTAGE" or "FLAT"
  "discountValue": 5,             // Optional: New discount value
  "validFrom": "2025-11-27T00:00:00Z", // Optional: New start date
  "validTo": "2025-12-25T23:59:59Z",   // Optional: New end date
  "status": "EXPIRED"             // Optional: "ACTIVE" or "EXPIRED"
}
```

#### Validation Rules
- Cannot change `applicableTo`, `menuItemId`, or `categoryId`
- Same validation rules as creation apply
- Cannot create overlapping active discounts

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "FLAT",
    "applicableTo": "MENU_ITEM",
    "menuItemId": 1,
    "categoryId": null,
    "discountValue": "5.00",
    "validFrom": "2025-11-27T00:00:00.000Z",
    "validTo": "2025-12-25T23:59:59.000Z",
    "status": "EXPIRED",
    "createdBy": "user-id-123",
    "menuItem": {
      "id": 1,
      "name": "Margherita Pizza",
      "imageUrl": "/images/pizza.jpg",
      "basePrice": "12.99"
    },
    "category": null
  }
}
```

#### Error Responses
- `400 Bad Request`: Invalid data or validation errors
- `404 Not Found`: Discount not found
- `409 Conflict`: Update would create overlapping discount

---

### 5. Delete Discount
**DELETE** `/api/admin/discounts/:id`

Permanently deletes a discount.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Discount deleted successfully"
  }
}
```

#### Error Responses
- `400 Bad Request`: Invalid ID
- `404 Not Found`: Discount not found

---

## Business Logic

### Discount Priority
When multiple discounts could apply:
1. **Item-specific discount** takes priority over category discount
2. If multiple item discounts exist, the highest value is applied
3. If multiple category discounts exist, the highest value is applied

### Auto-Expiry
- Discounts with `validTo` date in the past should be automatically marked as `EXPIRED`
- Implement via cron job using the `autoExpireDiscounts()` utility function
- Admin can manually reactivate expired discounts by updating status to `ACTIVE`

### Discount Calculation Examples

#### Percentage Discount (20% off $12.99)
```
discountAmount = $12.99 × 20 / 100 = $2.598
discountedPrice = $12.99 - $2.598 = $10.39
```

#### Flat Discount ($5 off $12.99)
```
discountedPrice = $12.99 - $5.00 = $7.99
```

#### Flat Discount ($15 off $12.99)
```
discountedPrice = max(0, $12.99 - $15.00) = $0.00
```

---

## Discount Calculation with Modifiers

### Important: Discounts Apply to Base Price Only

When a menu item has modifiers (add-ons), the discount is **only applied to the base price**, not to modifier costs.

#### How It Works

```
Menu Item: Margherita Pizza
Base Price: $12.99
Discount: 20% OFF

Customer adds modifiers:
  + Extra Cheese: $2.00
  + Olives: $1.50

Calculation:
1. Apply discount to base: $12.99 × 80% = $10.39
2. Add modifiers: $2.00 + $1.50 = $3.50
3. Final price: $10.39 + $3.50 = $13.89

Display:
Margherita Pizza (20% OFF)     $10.39
  Original base: $12.99
  + Extra Cheese                $2.00
  + Olives                      $1.50
                        Total: $13.89
You saved: $2.60 on base price!
```

#### Why This Approach?
- ✅ **Transparent**: Customers see exactly what they're paying for
- ✅ **Fair**: Modifiers reflect actual ingredient costs
- ✅ **Standard**: Matches industry practice (Domino's, Pizza Hut, etc.)
- ✅ **Simple**: Easy to calculate and explain

#### Required Modifiers (e.g., Pizza Sizes)

For items with required size selection:

**Setup:**
```
Base Price: $8.99 (Small - default size)

Size Options:
- Small:  +$0.00 (included in base)
- Medium: +$3.00 (upgrade cost)
- Large:  +$5.00 (upgrade cost)

Discount: 20% OFF
```

**Customer orders Large:**
```
1. Base (Small) with discount: $8.99 × 80% = $7.19
2. Size upgrade to Large: +$5.00
3. Final price: $12.19
4. Savings: $1.80 (only on base price)
```

**Display:**
```
Margherita Pizza - Large (20% OFF)
  Base (Small discounted): $7.19
  Size upgrade to Large: +$5.00
                  Total: $12.19
You saved $1.80!
```

---

## Order Item Structure with Modifiers

When creating an order with discounts and modifiers:

```typescript
const orderItem = {
  menuItemId: 1,
  quantity: 1,
  
  // Pricing breakdown
  basePrice: 12.99,           // Original base price
  discountedBasePrice: 10.39, // After 20% discount
  modifierTotal: 3.50,        // Sum of all modifiers
  itemTotal: 13.89,           // (10.39 + 3.50) × 1
  
  // Discount tracking
  appliedDiscountId: 1,
  discountAmount: 2.60,       // Savings on base price only
  
  // Selected modifiers
  modifiers: [
    {
      modifierGroupId: 2,
      optionId: 5,
      name: "Extra Cheese",
      price: 2.00,
      isRequired: false
    },
    {
      modifierGroupId: 2,
      optionId: 7,
      name: "Olives",
      price: 1.50,
      isRequired: false
    }
  ]
};
```

---

## Helper Functions

### Get Active Discount for Menu Item
```typescript
import { getActiveDiscountForMenuItem } from "@/lib/discount-utils";

const discount = await getActiveDiscountForMenuItem(menuItemId);
// Returns item-specific discount or category discount (priority order)
```

### Calculate Discounted Price
```typescript
import { calculateDiscountedPrice } from "@/lib/discount-utils";

const discountedPrice = calculateDiscountedPrice(
  basePrice,
  discountType,
  discountValue
);
```

### Auto-Expire Discounts (Cron Job)
```typescript
import { autoExpireDiscounts } from "@/lib/discount-utils";

// Run this in a cron job (daily or hourly)
const expiredCount = await autoExpireDiscounts();
console.log(`Auto-expired ${expiredCount} discounts`);
```

---

## Frontend Integration Notes

### Menu Display - Best Practices

#### Option 1: Show Original + Discounted Price (Recommended)
```
Margherita Pizza
$12.99  $10.39 (20% OFF)
```
**Pros:**
- Clearly shows savings
- Increases perceived value
- Common in e-commerce

#### Option 2: Show Only Discounted Price with Badge
```
Margherita Pizza
$10.39  [20% OFF]
```
**Pros:**
- Cleaner look
- Focuses on final price

#### Option 3: Strike-through Original Price
```
Margherita Pizza
$̶1̶2̶.̶9̶9̶ $10.39 SAVE $2.60
```
**Pros:**
- Most visible discount indicator
- Shows exact savings amount

### Order System Integration

When creating orders:
1. **Always store original `basePrice`** in `OrderItem`
2. **Calculate and apply discount at order creation time**
3. Store final price in `itemTotal`
4. Consider adding optional fields to track discount applied:
   - `appliedDiscountId`
   - `discountAmount`
   - `originalPrice` (before discount)

### API Response for Menu Items with Discounts

To get menu items with discount information, use the `includeDiscounts` query parameter:

```
GET /api/admin/menu-items?includeDiscounts=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Margherita Pizza",
        "basePrice": 12.99,
        "finalPrice": 10.39,
        "hasDiscount": true,
        "discount": {
          "id": 1,
          "type": "PERCENTAGE",
          "value": 20,
          "level": "ITEM",
          "validUntil": "2025-12-31T23:59:59Z"
        },
        "savingsAmount": 2.60,
        "savingsPercentage": 20,
        "category": {
          "id": 1,
          "name": "Pizzas"
        },
        "imageUrl": "/images/pizza.jpg",
        "description": "Classic margherita pizza",
        "isAvailable": true
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

**Field Descriptions:**
- `basePrice`: Original price before discount
- `finalPrice`: Price after applying discount (what customer pays)
- `hasDiscount`: Boolean indicating if discount is active
- `discount.level`: "ITEM" for item-specific discount, "CATEGORY" for category-wide discount
- `savingsAmount`: Dollar amount saved
- `savingsPercentage`: Percentage saved (for display purposes)

### Implementation Guide

#### 1. Fetching Menu Items with Discounts
```typescript
// Frontend API call
const response = await fetch('/api/admin/menu-items?includeDiscounts=true&categoryId=1');
const { data } = await response.json();

// Render items with discount information
data.items.forEach(item => {
  if (item.hasDiscount) {
    console.log(`${item.name}: Was $${item.basePrice}, Now $${item.finalPrice}`);
    console.log(`Save ${item.savingsPercentage}% ($${item.savingsAmount})`);
  }
});
```

#### 2. Display Component Example
```tsx
function MenuItemCard({ item }) {
  return (
    <div className="menu-item-card">
      <img src={item.imageUrl} alt={item.name} />
      <h3>{item.name}</h3>
      
      {item.hasDiscount ? (
        <div className="pricing">
          <span className="badge">
            {item.savingsPercentage}% OFF
          </span>
          <div className="prices">
            <span className="original-price">
              ${item.basePrice.toFixed(2)}
            </span>
            <span className="final-price">
              ${item.finalPrice.toFixed(2)}
            </span>
          </div>
          <span className="savings">
            Save ${item.savingsAmount.toFixed(2)}
          </span>
        </div>
      ) : (
        <span className="price">
          ${item.basePrice.toFixed(2)}
        </span>
      )}
      
      <button onClick={() => addToCart(item)}>
        Add to Cart
      </button>
    </div>
  );
}
```

#### 3. Order Creation with Discount
```typescript
async function createOrder(items) {
  const orderItems = items.map(item => ({
    menuItemId: item.id,
    quantity: item.quantity,
    basePrice: item.basePrice,
    // Use finalPrice for itemTotal
    itemTotal: item.finalPrice * item.quantity,
    // Track discount info (optional, for reporting)
    appliedDiscountId: item.discount?.id,
    discountAmount: item.hasDiscount 
      ? (item.basePrice - item.finalPrice) * item.quantity 
      : 0
  }));

  const response = await fetch('/api/counter/orders', {
    method: 'POST',
    body: JSON.stringify({ items: orderItems, /* ... */ })
  });
}
```

### Discount Priority Logic

The system applies discounts with the following priority:

1. **Item-specific discount** (highest priority)
   - Applied when `discount.level === "ITEM"`
   - Overrides any category discount

2. **Category-level discount** (fallback)
   - Applied when `discount.level === "CATEGORY"`
   - Only applied if no item-specific discount exists

3. **No discount** (default)
   - `hasDiscount === false`
   - `finalPrice === basePrice`

**Example Scenarios:**

| Item | Item Discount | Category Discount | Applied | Level |
|------|--------------|-------------------|---------|-------|
| Pizza A | 20% OFF | 10% OFF | 20% OFF | ITEM |
| Pizza B | None | 10% OFF | 10% OFF | CATEGORY |
| Pizza C | None | None | None | - |
| Pizza D | 15% OFF | None | 15% OFF | ITEM |

---

## Authentication
All discount endpoints require **Admin** role authentication via `requireAdmin()` middleware.

## Audit Logging
All discount operations (CREATE, UPDATE, DELETE) are automatically logged in the `AuditLog` table.

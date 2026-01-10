# ORDER, DELIVERY & PAYMENT API DOCUMENTATION

## Table of Contents
1. [Overview](#overview)
2. [Architecture & State Machines](#architecture--state-machines)
3. [Order Management APIs](#order-management-apis)
4. [Kitchen Display APIs](#kitchen-display-apis)
5. [Delivery Management APIs](#delivery-management-apis)
6. [Payment Processing APIs](#payment-processing-apis)
7. [Table Availability API](#table-availability-api)
8. [System Configuration](#system-configuration)
9. [Frontend Integration Guide](#frontend-integration-guide)
10. [Error Handling](#error-handling)

---

## Overview

This comprehensive module handles the complete restaurant order lifecycle including order creation, kitchen display workflow, delivery tracking, payment processing, and table management. The system supports three order types (DINE_IN, TAKEAWAY, DELIVERY) with role-based access control (COUNTER, KITCHEN, ADMIN, WAITER, DELIVERY).

### Key Features
- **Order Management**: Create, modify, cancel orders with validation
- **Kitchen Display**: Real-time order queue with FIFO ordering and stats
- **Delivery Tracking**: Status management with cancel/return workflows
- **Payment Processing**: Auto-creation, multiple methods, refund support
- **Discount Integration**: Automatic discount application from existing system
- **Service Charge**: Configurable percentage (default 10%)
- **Table Management**: Auto-occupy/free based on order lifecycle
- **Customer Management**: Phone-based upsert for deliveries
- **Audit Logging**: All operations tracked with timestamps

### Technology Stack
- **Framework**: Next.js 15.5.0 with App Router
- **Database**: PostgreSQL via Prisma Accelerate
- **Validation**: Zod for all inputs
- **Auth**: Better Auth with role-based middleware
- **Precision**: Decimal type for financial calculations

---

## Architecture & State Machines

### Order Status State Machine
```
ACTIVE → PREPARING → READY → SERVED
   ↓         ↓         ↓        
CANCELLED  CANCELLED  CANCELLED
   ↑         ↑         ↑
DELAYED   DELAYED   DELAYED
```

**Valid Transitions**:
- `ACTIVE` → `PREPARING`, `CANCELLED`, `DELAYED`
- `PREPARING` → `READY`, `CANCELLED`, `DELAYED`
- `READY` → `SERVED`, `CANCELLED`, `DELAYED`
- `DELAYED` → `PREPARING`, `CANCELLED`
- `SERVED` → (terminal)
- `CANCELLED` → (terminal)

**Modification Rules**:
- Only `ACTIVE` orders can be modified (items/quantities)
- All status transitions validated by state machine
- `DINE_IN` orders free table when `SERVED` or `CANCELLED`

### Delivery Status State Machine
```
PENDING → IN_TRANSIT → DELIVERED
   ↓           ↓           ↓
CANCELLED   CANCELLED   RETURNED
```

**Valid Transitions**:
- `PENDING` → `IN_TRANSIT`, `CANCELLED`
- `IN_TRANSIT` → `DELIVERED`, `RETURNED`, `CANCELLED`
- `DELIVERED` → `RETURNED`
- `CANCELLED` → (terminal)
- `RETURNED` → (terminal)

**Order Synchronization**:
- Order `READY` → Delivery `IN_TRANSIT`
- Delivery `DELIVERED` → Order `SERVED`
- Delivery `CANCELLED`/`RETURNED` → Order `CANCELLED`

### Payment Status State Machine
```
PENDING → COMPLETED
   ↓          ↓
FAILED    REFUNDED
```

**Valid Transitions**:
- `PENDING` → `COMPLETED`, `FAILED`
- `COMPLETED` → `REFUNDED`
- `FAILED` → (terminal)
- `REFUNDED` → (terminal)

**Order Synchronization**:
- Payment `COMPLETED` → Order `paymentStatus = PAID`
- Payment `REFUNDED` → Order `paymentStatus = REFUNDED`

### Payment Lifecycle
1. **Auto-Creation**: `PENDING` payment created on order creation
2. **Processing**: Counter updates to `COMPLETED` with payment method
3. **Refund**: Creates negative payment record + updates original + syncs order

---

## Order Management APIs

### 1. Create Order
**Endpoint**: `POST /api/counter/orders`  
**Access**: Counter, Admin  
**Purpose**: Create new order with automatic discount application and service charge

#### Request Body
```json
{
  "orderType": "DINE_IN",
  "tableId": "cm3xyz123",
  "waiterId": "cm3abc456",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerAddress": "123 Main St",
  "deliveryNotes": "Leave at door",
  "riderId": "cm3def789",
  "items": [
    {
      "menuItemId": "cm3item001",
      "quantity": 2,
      "specialInstructions": "Extra spicy",
      "modifiers": [
        {
          "modifierId": "cm3mod001",
          "quantity": 1
        }
      ]
    }
  ]
}
```

#### Field Requirements by Order Type
| Field | DINE_IN | TAKEAWAY | DELIVERY |
|-------|---------|----------|----------|
| `tableId` | **Required** | Optional | Optional |
| `waiterId` | Optional | Optional | Optional |
| `customerName` | Optional | Optional | **Required** |
| `customerPhone` | Optional | Optional | **Required** |
| `customerAddress` | Optional | Optional | **Required** |
| `riderId` | N/A | N/A | Optional |

#### Response (201 Created)
```json
{
  "id": "cm3order001",
  "orderNumber": "ORD-20250127-001",
  "orderType": "DINE_IN",
  "status": "ACTIVE",
  "paymentStatus": "PENDING",
  "tableId": "cm3xyz123",
  "waiterId": "cm3abc456",
  "subtotal": "25.50",
  "discountAmount": "2.55",
  "serviceChargeAmount": "2.30",
  "grandTotal": "25.25",
  "items": [
    {
      "id": "cm3oi001",
      "menuItemId": "cm3item001",
      "name": "Spicy Burger",
      "basePrice": "10.00",
      "discountedBasePrice": "9.00",
      "quantity": 2,
      "subtotal": "18.00",
      "appliedDiscountId": "cm3disc001",
      "discountAmount": "2.00",
      "specialInstructions": "Extra spicy",
      "modifiers": [
        {
          "id": "cm3oim001",
          "name": "Extra Cheese",
          "priceAdjustment": "2.00",
          "quantity": 1
        }
      ]
    }
  ],
  "customer": {
    "id": "cm3cust001",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "delivery": {
    "id": "cm3del001",
    "status": "PENDING",
    "riderId": "cm3def789"
  },
  "payments": [
    {
      "id": "cm3pay001",
      "status": "PENDING",
      "amount": "25.25"
    }
  ],
  "createdAt": "2025-01-27T10:30:00Z"
}
```

#### Business Logic Flow
1. **Validation**: Checks order type requirements (table for DINE_IN, customer for DELIVERY)
2. **Customer Upsert**: Creates or updates customer by phone (for DELIVERY)
3. **Table Availability**: Validates no active orders on table (for DINE_IN)
4. **Menu Validation**: Checks items are available and not archived
5. **Discount Application**: Automatically applies active item/category discounts
6. **Calculation**: Computes subtotal, discount, service charge (from SystemConfig), grand total
7. **Transaction**: Creates order + items + modifiers + payment + delivery (if applicable)
8. **Table Update**: Marks table as occupied (for DINE_IN)
9. **Audit Log**: Records creation with employeeId

---

### 2. List Orders
**Endpoint**: `GET /api/counter/orders`  
**Access**: Counter, Admin  
**Purpose**: Retrieve paginated orders with filters

#### Query Parameters
```
?page=1
&limit=20
&status=ACTIVE,PREPARING
&orderType=DINE_IN
&paymentStatus=PENDING
&startDate=2025-01-01
&endDate=2025-01-31
&searchCustomer=John
```

#### Response (200 OK)
```json
{
  "orders": [
    {
      "id": "cm3order001",
      "orderNumber": "ORD-20250127-001",
      "orderType": "DINE_IN",
      "status": "ACTIVE",
      "paymentStatus": "PENDING",
      "grandTotal": "25.25",
      "table": {
        "tableNumber": "T5",
        "capacity": 4
      },
      "customer": {
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "waiter": {
        "name": "Jane Smith"
      },
      "itemsCount": 2,
      "createdAt": "2025-01-27T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 3. Get Order Details
**Endpoint**: `GET /api/counter/orders/:id`  
**Access**: Counter, Admin  
**Purpose**: Retrieve complete order details with all relations

#### Response (200 OK)
```json
{
  "id": "cm3order001",
  "orderNumber": "ORD-20250127-001",
  "orderType": "DINE_IN",
  "status": "PREPARING",
  "paymentStatus": "PENDING",
  "tableId": "cm3xyz123",
  "waiterId": "cm3abc456",
  "subtotal": "25.50",
  "discountAmount": "2.55",
  "serviceChargeAmount": "2.30",
  "grandTotal": "25.25",
  "items": [
    {
      "id": "cm3oi001",
      "menuItemId": "cm3item001",
      "name": "Spicy Burger",
      "basePrice": "10.00",
      "discountedBasePrice": "9.00",
      "quantity": 2,
      "subtotal": "18.00",
      "appliedDiscountId": "cm3disc001",
      "discountAmount": "2.00",
      "specialInstructions": "Extra spicy",
      "modifiers": [
        {
          "id": "cm3oim001",
          "modifierId": "cm3mod001",
          "name": "Extra Cheese",
          "priceAdjustment": "2.00",
          "quantity": 1
        }
      ],
      "menuItem": {
        "name": "Spicy Burger",
        "category": {
          "name": "Burgers"
        }
      }
    }
  ],
  "table": {
    "id": "cm3xyz123",
    "tableNumber": "T5",
    "capacity": 4
  },
  "waiter": {
    "id": "cm3abc456",
    "name": "Jane Smith"
  },
  "customer": {
    "id": "cm3cust001",
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  },
  "delivery": {
    "id": "cm3del001",
    "status": "IN_TRANSIT",
    "riderId": "cm3def789",
    "deliveryAddress": "123 Main St",
    "deliveryNotes": "Leave at door",
    "rider": {
      "name": "Mike Driver"
    }
  },
  "payments": [
    {
      "id": "cm3pay001",
      "status": "PENDING",
      "amount": "25.25",
      "paymentMethod": null,
      "createdAt": "2025-01-27T10:30:00Z"
    }
  ],
  "createdAt": "2025-01-27T10:30:00Z",
  "updatedAt": "2025-01-27T10:35:00Z"
}
```

---

### 4. Update Order
**Endpoint**: `PUT /api/counter/orders/:id`  
**Access**: Counter, Admin  
**Purpose**: Modify order items/quantities (only when status = ACTIVE)

#### Request Body
```json
{
  "items": [
    {
      "menuItemId": "cm3item001",
      "quantity": 3,
      "specialInstructions": "No onions",
      "modifiers": [
        {
          "modifierId": "cm3mod001",
          "quantity": 2
        }
      ]
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "id": "cm3order001",
  "status": "ACTIVE",
  "subtotal": "35.50",
  "discountAmount": "3.55",
  "serviceChargeAmount": "3.20",
  "grandTotal": "35.15",
  "items": [...],
  "updatedAt": "2025-01-27T10:40:00Z"
}
```

#### Business Logic
1. **Status Check**: Returns 400 if status ≠ ACTIVE
2. **Delete Old Items**: Removes all existing OrderItems in transaction
3. **Recalculate**: Applies current discounts and service charge
4. **Update Payment**: Updates PENDING payment amount to match new total
5. **Audit Log**: Records modification

---

### 5. Cancel Order
**Endpoint**: `PUT /api/counter/orders/:id/cancel`  
**Access**: Counter, Admin  
**Purpose**: Cancel order with reason

#### Request Body
```json
{
  "cancellationReason": "Customer requested cancellation"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3order001",
  "status": "CANCELLED",
  "cancellationReason": "Customer requested cancellation",
  "cancelledAt": "2025-01-27T10:45:00Z"
}
```

#### Business Logic
1. **Status Check**: Cannot cancel if already SERVED or CANCELLED
2. **Free Table**: Sets isAvailable=true if DINE_IN
3. **Cancel Delivery**: Updates delivery status to CANCELLED if exists
4. **Audit Log**: Records cancellation with reason

---

## Kitchen Display APIs

### 6. List Kitchen Orders
**Endpoint**: `GET /api/kitchen/orders`  
**Access**: Kitchen, Admin  
**Purpose**: Retrieve orders for kitchen display with FIFO ordering

#### Query Parameters
```
?status=ACTIVE,PREPARING,READY
&orderType=DINE_IN
&excludeCancelled=true
```

#### Response (200 OK)
```json
{
  "orders": [
    {
      "id": "cm3order001",
      "orderNumber": "ORD-20250127-001",
      "orderType": "DINE_IN",
      "status": "ACTIVE",
      "elapsedMinutes": 5,
      "table": {
        "tableNumber": "T5"
      },
      "waiter": {
        "name": "Jane Smith"
      },
      "items": [
        {
          "id": "cm3oi001",
          "name": "Spicy Burger",
          "quantity": 2,
          "specialInstructions": "Extra spicy",
          "modifiers": [
            {
              "name": "Extra Cheese",
              "quantity": 1
            }
          ]
        }
      ],
      "createdAt": "2025-01-27T10:30:00Z"
    }
  ]
}
```

#### Features
- **FIFO Ordering**: Orders sorted by `createdAt ASC`
- **Elapsed Time**: Calculated as minutes since creation
- **All Order Types**: Shows DINE_IN, TAKEAWAY, DELIVERY
- **Filtering**: Status and order type filters
- **Excludes Cancelled**: By default excludes CANCELLED orders

---

### 7. Kitchen Order Stats
**Endpoint**: `GET /api/kitchen/orders/stats`  
**Access**: Kitchen, Admin  
**Purpose**: Real-time stats for kitchen dashboard

#### Response (200 OK)
```json
{
  "total": 25,
  "pending": 8,
  "preparing": 12,
  "ready": 3,
  "served": 2,
  "delayed": 0
}
```

#### Definitions
- `total`: All orders (excluding CANCELLED)
- `pending`: Orders with status = ACTIVE
- `preparing`: Orders with status = PREPARING
- `ready`: Orders with status = READY
- `served`: Orders with status = SERVED
- `delayed`: Orders with status = DELAYED

---

### 8. Update Order Status (Kitchen)
**Endpoint**: `PUT /api/kitchen/orders/:id/status`  
**Access**: Kitchen, Admin  
**Purpose**: Update order status from kitchen display

#### Request Body
```json
{
  "status": "PREPARING"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3order001",
  "status": "PREPARING",
  "updatedAt": "2025-01-27T10:35:00Z"
}
```

#### Business Logic
1. **Validate Transition**: Checks state machine rules
2. **Free Table**: If SERVED + DINE_IN, marks table available
3. **Sync Delivery**: If READY + DELIVERY, sets delivery to IN_TRANSIT
4. **Audit Log**: Records status change

#### Example Workflow
```
Kitchen receives order (ACTIVE)
↓
Chef starts cooking → PUT status=PREPARING
↓
Food ready → PUT status=READY (auto-syncs delivery to IN_TRANSIT)
↓
Served to customer → PUT status=SERVED (frees table if DINE_IN)
```

---

## Delivery Management APIs

### 9. List Deliveries
**Endpoint**: `GET /api/counter/deliveries`  
**Access**: Counter, Admin  
**Purpose**: Track all deliveries with filters

#### Query Parameters
```
?status=PENDING,IN_TRANSIT
&riderId=cm3def789
&startDate=2025-01-27
&endDate=2025-01-27
&searchCustomer=John
```

#### Response (200 OK)
```json
{
  "deliveries": [
    {
      "id": "cm3del001",
      "status": "IN_TRANSIT",
      "deliveryAddress": "123 Main St",
      "deliveryNotes": "Leave at door",
      "riderId": "cm3def789",
      "order": {
        "id": "cm3order001",
        "orderNumber": "ORD-20250127-001",
        "status": "READY",
        "grandTotal": "25.25",
        "items": [
          {
            "name": "Spicy Burger",
            "quantity": 2
          }
        ]
      },
      "customer": {
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "rider": {
        "name": "Mike Driver",
        "phone": "+9876543210"
      },
      "createdAt": "2025-01-27T10:30:00Z",
      "updatedAt": "2025-01-27T10:40:00Z"
    }
  ]
}
```

---

### 10. Update Delivery Status
**Endpoint**: `PUT /api/counter/deliveries/:id/status`  
**Access**: Counter, Admin  
**Purpose**: Update delivery status with order synchronization

#### Request Body
```json
{
  "status": "IN_TRANSIT"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3del001",
  "status": "IN_TRANSIT",
  "updatedAt": "2025-01-27T10:40:00Z"
}
```

#### Order Synchronization
| Delivery Status | Order Status |
|----------------|--------------|
| `DELIVERED` | → `SERVED` |
| `CANCELLED` | → `CANCELLED` |
| `RETURNED` | → `CANCELLED` |

---

### 11. Cancel Delivery
**Endpoint**: `PUT /api/counter/deliveries/:id/cancel`  
**Access**: Counter, Admin  
**Purpose**: Cancel delivery with reason

#### Request Body
```json
{
  "cancellationReason": "Customer unavailable"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3del001",
  "status": "CANCELLED",
  "cancellationReason": "Customer unavailable",
  "cancelledAt": "2025-01-27T10:45:00Z"
}
```

#### Business Logic
1. **Status Check**: Cannot cancel if DELIVERED or RETURNED
2. **Sync Order**: Updates order status to CANCELLED
3. **Audit Log**: Records cancellation with reason

---

### 12. Return Delivery
**Endpoint**: `PUT /api/counter/deliveries/:id/return`  
**Access**: Counter, Admin  
**Purpose**: Mark delivery as returned

#### Request Body
```json
{
  "returnReason": "Customer refused delivery"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3del001",
  "status": "RETURNED",
  "returnReason": "Customer refused delivery",
  "returnedAt": "2025-01-27T11:00:00Z"
}
```

#### Business Logic
1. **Status Check**: Only allowed from IN_TRANSIT or DELIVERED
2. **Sync Order**: Updates order status to CANCELLED
3. **Audit Log**: Records return with reason

---

## Payment Processing APIs

### 13. List Payments
**Endpoint**: `GET /api/counter/payments`  
**Access**: Counter, Admin  
**Purpose**: Retrieve payments with filters

#### Query Parameters
```
?status=PENDING,COMPLETED
&paymentMethod=CASH
&orderId=cm3order001
&startDate=2025-01-27
&endDate=2025-01-27
```

#### Response (200 OK)
```json
{
  "payments": [
    {
      "id": "cm3pay001",
      "status": "COMPLETED",
      "amount": "25.25",
      "paymentMethod": "CASH",
      "transactionReference": null,
      "order": {
        "id": "cm3order001",
        "orderNumber": "ORD-20250127-001",
        "customer": {
          "name": "John Doe"
        },
        "table": {
          "tableNumber": "T5"
        },
        "items": [
          {
            "name": "Spicy Burger",
            "quantity": 2
          }
        ]
      },
      "createdAt": "2025-01-27T10:30:00Z",
      "completedAt": "2025-01-27T10:50:00Z"
    }
  ]
}
```

---

### 14. Update Payment
**Endpoint**: `PUT /api/counter/payments/:id`  
**Access**: Counter, Admin  
**Purpose**: Process payment completion

#### Request Body
```json
{
  "status": "COMPLETED",
  "paymentMethod": "CARD",
  "transactionReference": "TXN123456"
}
```

#### Response (200 OK)
```json
{
  "id": "cm3pay001",
  "status": "COMPLETED",
  "paymentMethod": "CARD",
  "transactionReference": "TXN123456",
  "completedAt": "2025-01-27T10:50:00Z"
}
```

#### Business Logic
1. **Validate Transition**: Checks payment state machine
2. **Sync Order**: If status=COMPLETED, sets order.paymentStatus=PAID
3. **Timestamp**: Sets completedAt or failedAt based on status
4. **Audit Log**: Records payment processing

---

### 15. Refund Payment
**Endpoint**: `PUT /api/counter/payments/:id/refund`  
**Access**: Counter, Admin  
**Purpose**: Process full refund (industry standard pattern)

#### Request Body
```json
{
  "refundReason": "Customer complaint",
  "refundMethod": "CASH"
}
```

#### Response (200 OK)
```json
{
  "originalPayment": {
    "id": "cm3pay001",
    "status": "REFUNDED",
    "refundReason": "Customer complaint",
    "refundMethod": "CASH",
    "refundedAmount": "25.25",
    "refundedAt": "2025-01-27T11:00:00Z"
  },
  "refundPayment": {
    "id": "cm3pay002",
    "status": "COMPLETED",
    "amount": "-25.25",
    "paymentMethod": "CASH",
    "createdAt": "2025-01-27T11:00:00Z"
  }
}
```

#### Business Logic (Industry Standard)
1. **Validation**: Only COMPLETED payments with order.paymentStatus=PAID can be refunded
2. **Negative Payment**: Creates new payment record with negative amount
3. **Update Original**: Sets status=REFUNDED, adds refund details
4. **Sync Order**: Updates order.paymentStatus=REFUNDED
5. **Transaction**: All updates in single transaction
6. **Audit Log**: Records refund with reason

---

## Table Availability API

### 16. Get Available Tables
**Endpoint**: `GET /api/counter/tables/available`  
**Access**: Counter, Admin  
**Purpose**: Retrieve tables for DINE_IN order creation

#### Query Parameters
```
?minCapacity=4
```

#### Response (200 OK)
```json
{
  "tables": [
    {
      "id": "cm3xyz123",
      "tableNumber": "T5",
      "capacity": 4,
      "location": "Main Hall",
      "isAvailable": true
    },
    {
      "id": "cm3xyz124",
      "tableNumber": "T6",
      "capacity": 6,
      "location": "Main Hall",
      "isAvailable": true
    }
  ]
}
```

#### Business Logic
- Returns tables with `isAvailable=true`
- Excludes tables with active orders (status in ACTIVE, PREPARING, READY)
- Optional capacity filter
- Ordered by tableNumber

---

## System Configuration

### Service Charge Configuration

Service charge is stored in the `SystemConfig` table and cached for 60 seconds.

#### Default Configuration
```json
{
  "SERVICE_CHARGE_PERCENTAGE": "10",
  "SERVICE_CHARGE_ENABLED": "true"
}
```

#### Update via Database
```sql
-- Update percentage
UPDATE "SystemConfig" 
SET value = '15' 
WHERE key = 'SERVICE_CHARGE_PERCENTAGE';

-- Disable service charge
UPDATE "SystemConfig" 
SET value = 'false' 
WHERE key = 'SERVICE_CHARGE_ENABLED';
```

#### Calculation Example
```javascript
// If SERVICE_CHARGE_ENABLED = true and SERVICE_CHARGE_PERCENTAGE = 10
subtotal = 100.00
discountAmount = 10.00 // from discount system
afterDiscount = 90.00

serviceChargeAmount = afterDiscount * 0.10 = 9.00
grandTotal = 90.00 + 9.00 = 99.00
```

---

## Frontend Integration Guide

### SWR Polling Strategy (5 seconds)

#### Kitchen Display Component
```typescript
import useSWR from 'swr';

// Kitchen orders with 5-second polling
const { data: orders, error } = useSWR(
  '/api/kitchen/orders?status=ACTIVE,PREPARING,READY',
  fetcher,
  {
    refreshInterval: 5000, // 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  }
);

// Kitchen stats with 5-second polling
const { data: stats } = useSWR(
  '/api/kitchen/orders/stats',
  fetcher,
  {
    refreshInterval: 5000
  }
);

// Display
return (
  <div>
    <Stats {...stats} />
    <OrderQueue orders={orders} />
  </div>
);
```

#### Counter Orders Component
```typescript
const { data: orders, mutate } = useSWR(
  '/api/counter/orders?page=1&limit=20',
  fetcher,
  {
    refreshInterval: 5000,
    revalidateOnFocus: true
  }
);

// Update order status
const updateStatus = async (orderId: string, status: string) => {
  await fetch(`/api/kitchen/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  mutate(); // Revalidate immediately
};
```

#### Delivery Tracking Component
```typescript
const { data: deliveries } = useSWR(
  '/api/counter/deliveries?status=PENDING,IN_TRANSIT',
  fetcher,
  {
    refreshInterval: 5000
  }
);

return (
  <DeliveryMap deliveries={deliveries} />
);
```

### Order Creation Flow
```typescript
// Step 1: Get available tables
const { data: tables } = useSWR('/api/counter/tables/available?minCapacity=4');

// Step 2: Create order
const createOrder = async (orderData) => {
  const response = await fetch('/api/counter/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderType: 'DINE_IN',
      tableId: selectedTable.id,
      items: cart.items
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
};
```

### Payment Processing Flow
```typescript
// Step 1: Get order details
const { data: order } = useSWR(`/api/counter/orders/${orderId}`);

// Step 2: Process payment
const processPayment = async (paymentId: string) => {
  await fetch(`/api/counter/payments/${paymentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'COMPLETED',
      paymentMethod: 'CASH'
    })
  });
  
  // Revalidate order to show updated payment status
  mutate(`/api/counter/orders/${orderId}`);
};

// Step 3: Process refund (if needed)
const processRefund = async (paymentId: string) => {
  await fetch(`/api/counter/payments/${paymentId}/refund`, {
    method: 'PUT',
    body: JSON.stringify({
      refundReason: 'Customer complaint',
      refundMethod: 'CASH'
    })
  });
  
  mutate(`/api/counter/orders/${orderId}`);
};
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Cannot modify order that is not in ACTIVE status"
}
```

#### 403 Forbidden
```json
{
  "error": "Access denied. Counter, Kitchen, or Admin role required."
}
```

#### 404 Not Found
```json
{
  "error": "Order not found"
}
```

#### 409 Conflict
```json
{
  "error": "Table is already occupied by another active order"
}
```

#### 422 Unprocessable Entity (Validation)
```json
{
  "error": "Validation failed",
  "issues": [
    {
      "path": ["orderType"],
      "message": "Invalid enum value. Expected 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'"
    },
    {
      "path": ["items", 0, "quantity"],
      "message": "Number must be greater than 0"
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message for debugging"
}
```

### Frontend Error Handling
```typescript
try {
  const response = await fetch('/api/counter/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 422) {
      // Validation errors
      error.issues.forEach(issue => {
        showFieldError(issue.path, issue.message);
      });
    } else {
      // Generic error
      showNotification(error.error, 'error');
    }
    return;
  }
  
  const order = await response.json();
  showNotification('Order created successfully', 'success');
  router.push(`/orders/${order.id}`);
  
} catch (err) {
  showNotification('Network error. Please try again.', 'error');
}
```

---

## Workflow Examples

### Complete DINE_IN Order Flow
```
1. Counter: GET /api/counter/tables/available?minCapacity=4
   → Select table T5

2. Counter: POST /api/counter/orders
   {
     "orderType": "DINE_IN",
     "tableId": "cm3xyz123",
     "items": [...]
   }
   → Order created (status=ACTIVE, payment=PENDING)
   → Table T5 marked occupied

3. Kitchen: GET /api/kitchen/orders (SWR 5s polling)
   → Order appears in kitchen queue

4. Kitchen: PUT /api/kitchen/orders/:id/status { "status": "PREPARING" }
   → Order moves to preparing section

5. Kitchen: PUT /api/kitchen/orders/:id/status { "status": "READY" }
   → Order ready for serving

6. Waiter: Serves food

7. Counter: PUT /api/counter/payments/:paymentId
   {
     "status": "COMPLETED",
     "paymentMethod": "CASH"
   }
   → Payment completed, order.paymentStatus=PAID

8. Kitchen: PUT /api/kitchen/orders/:id/status { "status": "SERVED" }
   → Table T5 freed automatically
```

### Complete DELIVERY Order Flow
```
1. Counter: POST /api/counter/orders
   {
     "orderType": "DELIVERY",
     "customerName": "John Doe",
     "customerPhone": "+1234567890",
     "customerAddress": "123 Main St",
     "riderId": "cm3def789",
     "items": [...]
   }
   → Order created (status=ACTIVE)
   → Delivery created (status=PENDING)
   → Payment created (status=PENDING)
   → Customer upserted by phone

2. Kitchen: PUT /api/kitchen/orders/:id/status { "status": "PREPARING" }

3. Kitchen: PUT /api/kitchen/orders/:id/status { "status": "READY" }
   → Delivery auto-synced to IN_TRANSIT

4. Counter: GET /api/counter/deliveries (SWR 5s polling)
   → Track delivery status

5. Counter: PUT /api/counter/deliveries/:id/status { "status": "DELIVERED" }
   → Order auto-synced to SERVED

6. Counter: PUT /api/counter/payments/:paymentId
   {
     "status": "COMPLETED",
     "paymentMethod": "CASH"
   }
   → Payment completed
```

### Refund Flow
```
1. Counter: GET /api/counter/orders/:id
   → Verify order is paid (paymentStatus=PAID)

2. Counter: GET /api/counter/payments?orderId=:id
   → Get payment ID

3. Counter: PUT /api/counter/payments/:paymentId/refund
   {
     "refundReason": "Customer complaint",
     "refundMethod": "CASH"
   }
   → Negative payment created (-25.25)
   → Original payment marked REFUNDED
   → Order paymentStatus=REFUNDED
```

---

## Testing Checklist

### Order Management
- [ ] Create DINE_IN order (requires tableId)
- [ ] Create TAKEAWAY order (no table required)
- [ ] Create DELIVERY order (requires customer details)
- [ ] Verify table auto-occupied on DINE_IN creation
- [ ] Verify discount application on items
- [ ] Verify service charge calculation
- [ ] Modify ACTIVE order items
- [ ] Attempt to modify PREPARING order (should fail)
- [ ] Cancel order at each status
- [ ] Verify table freed on cancellation (DINE_IN)

### Kitchen Display
- [ ] List orders with FIFO ordering
- [ ] Verify elapsed time calculation
- [ ] Get kitchen stats (all counts correct)
- [ ] Update status through valid transitions
- [ ] Attempt invalid transition (should fail)
- [ ] Verify table freed when SERVED (DINE_IN)
- [ ] Verify delivery synced when READY (DELIVERY)

### Delivery Management
- [ ] List deliveries with filters
- [ ] Update delivery status
- [ ] Verify order synced when DELIVERED
- [ ] Cancel delivery (verify order cancelled)
- [ ] Return delivery from IN_TRANSIT
- [ ] Return delivery from DELIVERED

### Payment Processing
- [ ] Verify auto-created PENDING payment
- [ ] Update payment to COMPLETED (cash)
- [ ] Update payment to COMPLETED (card with reference)
- [ ] Verify order synced to PAID
- [ ] Process refund on COMPLETED payment
- [ ] Verify negative payment created
- [ ] Verify order synced to REFUNDED
- [ ] Attempt refund on PENDING payment (should fail)

### Table Management
- [ ] Get available tables
- [ ] Filter by minCapacity
- [ ] Verify occupied tables excluded
- [ ] Verify table freed after order SERVED/CANCELLED

---

## Performance Considerations

### Database Indexes (Already in Schema)
```prisma
@@index([status])
@@index([orderType])
@@index([paymentStatus])
@@index([tableId])
@@index([customerId])
@@index([createdAt])
```

### Caching Strategy
- **SystemConfig**: 60-second in-memory cache
- **Frontend**: SWR with 5-second polling
- **Stale-While-Revalidate**: Instant UI updates

### Query Optimization
- Use `select` to limit returned fields
- Use `include` only when relations needed
- Pagination for list endpoints
- Indexed filters (status, orderType, dates)

---

## Security Notes

### Role-Based Access Control
- **Counter**: Full order management, payment processing
- **Kitchen**: Order viewing, status updates
- **Admin**: All permissions
- **Waiter**: (future) Order serving, table management
- **Delivery**: (future) Delivery status updates

### Data Validation
- All inputs validated with Zod schemas
- State machine enforces valid transitions
- Financial calculations use Decimal type
- Audit logging for all operations

### Session Management
- Better Auth for session handling
- Middleware checks on all routes
- Employee ID tracked in audit logs

---

## Future Enhancements (Not Implemented)

1. **Inventory Integration**: Deduct stock on order creation
2. **Waiter Mobile App**: Self-service status updates
3. **Rider Mobile App**: Delivery tracking, GPS integration
4. **Push Notifications**: Real-time order updates
5. **Analytics**: Sales reports, popular items, peak hours
6. **Multi-Restaurant**: Support for restaurant chains
7. **Advanced Discounts**: Time-based, happy hour, loyalty
8. **Split Payments**: Multiple payment methods per order
9. **Tips**: Waiter/rider tip tracking
10. **Customer Portal**: Order history, reordering

---

## Support

For issues or questions:
1. Check error responses for validation details
2. Review state machine diagrams for valid transitions
3. Verify role permissions for API access
4. Check SystemConfig for service charge settings
5. Review audit logs for operation history

**Documentation Version**: 1.0  
**Last Updated**: January 27, 2025  
**API Version**: v1

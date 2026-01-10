# Pharmacy Management API Endpoints

## Overview
This document outlines all the API endpoints for the pharmacy management system.

## Base URL
All endpoints are prefixed with `/api/admin/`

## Authentication
All endpoints require authentication with pharmacy roles (OWNER, PHARMACIST, CASHIER, STOREKEEPER) or ADMIN role.

---

## 1. Item Management

### GET /api/admin/pharmacy-items
Get all pharmacy items with stock information.

**Query Parameters:**
- `categoryId` (optional): Filter by category ID
- `status` (optional): Filter by item status (ACTIVE/INACTIVE)
- `search` (optional): Search by item name, generic name, or brand

**Response:**
```json
[
  {
    "id": 1,
    "itemName": "Napa 500mg",
    "genericName": "Paracetamol",
    "brand": "Beximco",
    "strength": "500mg",
    "category": { "id": 1, "name": "Tablet" },
    "totalStock": 150,
    "stockStatus": "IN_STOCK",
    "batches": [...]
  }
]
```

### POST /api/admin/pharmacy-items
Create a new pharmacy item.

### GET /api/admin/pharmacy-items/[id]
Get a specific pharmacy item with batch details.

### PUT /api/admin/pharmacy-items/[id]
Update a pharmacy item.

### DELETE /api/admin/pharmacy-items/[id]
Delete a pharmacy item.

---

## 2. Purchase Management

### GET /api/admin/pharmacy-purchases
Get all purchase orders with pagination.

**Query Parameters:**
- `status` (optional): Filter by status (LISTED/ORDERED/RECEIVED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### POST /api/admin/pharmacy-purchases
Create a new purchase order.

### PUT /api/admin/pharmacy-purchases/[id]/order
Mark a purchase order as ordered.

### PUT /api/admin/pharmacy-purchases/[id]/receive
Mark items in a purchase order as received.

---

## 3. Stock Entry

### GET /api/admin/pharmacy-stock-entry
Get received items ready for stock entry.

### POST /api/admin/pharmacy-stock-entry
Create a new batch (stock entry).

---

## 4. Inventory Management

### GET /api/admin/pharmacy-inventory
Get all inventory items with stock status and pagination.

**Query Parameters:**
- `stockStatus` (optional): Filter by stock status (IN_STOCK/LOW_STOCK/OUT_OF_STOCK)
- `itemStatus` (optional): Filter by item status (ACTIVE/INACTIVE)
- `search` (optional): Search by item name, generic name, or brand
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### GET /api/admin/pharmacy-inventory/[id]/batches
Get all batches for a specific item.

---

## 5. Damage/Loss Management

### GET /api/admin/pharmacy-damage
Get all damage records with pagination.

**Query Parameters:**
- `itemId` (optional): Filter by item ID
- `batchId` (optional): Filter by batch ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### POST /api/admin/pharmacy-damage
Create a damage record.

---

## 6. POS/Sales Management

### GET /api/admin/pharmacy-pos-items
Get items available for sale in POS.

**Query Parameters:**
- `search` (optional): Search by item name, generic name, or brand

### GET /api/admin/pharmacy-sales
Get all sales records with pagination.

**Query Parameters:**
- `status` (optional): Filter by status (COMPLETED/RETURNED)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### POST /api/admin/pharmacy-sales
Create a new sale.

### PUT /api/admin/pharmacy-sales/[id]/return
Process a return for a sale.

---

## 7. Batch Management

### POST /api/admin/pharmacy-batch-activate
Manually activate a specific batch.

**Required Role:** PHARMACIST, OWNER, or ADMIN

### PUT /api/admin/pharmacy-batch-activate
Auto-activate the next available batch for an item (FIFO).

**Required Role:** PHARMACIST, OWNER, or ADMIN

---

## 8. Reports & Analytics

### GET /api/admin/pharmacy-dashboard
Get pharmacy dashboard statistics.

### GET /api/admin/pharmacy-sold-out
Get all sold-out and expired batches with pagination.

**Query Parameters:**
- `itemId` (optional): Filter by item ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

---

## 9. Cron Jobs

### GET /api/cron/pharmacy-batch-management
Comprehensive batch management cron job.

**Headers:**
- `Authorization: Bearer {CRON_SECRET}`

---

## Authentication & Authorization

### Roles:
- **ADMIN**: Full access to all endpoints
- **OWNER**: Full pharmacy access
- **PHARMACIST**: Full pharmacy access + batch activation
- **CASHIER**: Sales and POS access
- **STOREKEEPER**: Inventory and stock management

### Error Responses:
- `401`: Unauthorized (no valid session)
- `403`: Forbidden (insufficient role permissions)
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

### Success Responses:
All successful responses follow the pattern:
```json
{
  "data": {...},
  "pagination": {...} // for paginated endpoints
}
```
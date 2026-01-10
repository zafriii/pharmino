# Batch Expiry Management & Optimization

This document explains the intelligent batch expiry management and optimization system that automatically manages batch activation based on expiry dates and stock levels.

## Features

### 1. Automatic Expiry Check & Batch Optimization
- When fetching batches via `/api/admin/inventory/[id]/batches`, the system automatically:
  - Checks for expired batches and updates their status to `EXPIRED`
  - If an active batch expires, automatically activates the next best batch
  - Ensures the batch with the earliest expiry date is always active
  - **Important**: Batches expire the day AFTER the expiry date (e.g., batch with expiry date Jan 10 expires on Jan 11)
  - Uses consistent UTC-based date comparison to ensure same behavior across environments

### 2. Intelligent Batch Activation Logic
The system follows these rules for batch activation:

**Priority Order for Activation:**
1. **Expiry Date** (earliest first)
2. **Creation Date** (oldest first)

**Activation Scenarios:**
- **When Active Batch Expires**: Automatically activates the next available batch with earliest expiry
- **When Active Batch Sold Out**: Activates next batch (same as damage API logic)
- **Optimization Check**: Ensures the batch with earliest expiry is always active, even if created later

**Example Scenario:**
- Batch ACE-002: Created first, expires 2026-02-15, Status: ACTIVE
- Batch ACE-004: Created later, expires 2026-01-10, Status: INACTIVE
- **System Action**: ACE-004 will be activated because it expires earlier, ACE-002 becomes INACTIVE

### 3. Enhanced Batch Information
Each batch now includes additional expiry information:
- `isExpired`: Boolean indicating if the batch is expired
- `expiryDateFormatted`: Human-readable expiry date
- `daysUntilExpiry`: Number of days until expiry (negative if expired)
- `expiryStatus`: Status indicator (`VALID`, `EXPIRING_SOON`, `EXPIRING_WITHIN_3_MONTHS`, `EXPIRED`, `NO_EXPIRY_DATE`)

### 4. Batch Optimization APIs
- **Analyze**: Get recommendations without making changes
- **Optimize**: Automatically optimize batch activation for items
- **Manual Control**: Force activate specific batches

## API Endpoints

### GET /api/admin/inventory/[id]/batches
**Enhanced with automatic expiry checking and batch optimization**

Response now includes:
```json
{
  "success": true,
  "data": {
    "item": {...},
    "batches": {...},
    "summary": {...},
    "expiryUpdateResult": {
      "success": true,
      "updatedCount": 2,
      "message": "Successfully updated 2 expired batches",
      "batches": [...],
      "activationResults": [
        {
          "itemId": 123,
          "itemName": "Paracetamol",
          "success": true,
          "activatedBatch": {
            "id": 456,
            "batchNumber": "ACE-004",
            "expiryDate": "1/10/2026",
            "quantity": 100
          },
          "message": "Activated batch ACE-004"
        }
      ]
    }
  }
}
```

### GET /api/admin/inventory/optimize-batches
**Get batch optimization recommendations**

Query Parameters:
- `itemId` (optional): Analyze specific item only

Response:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "itemId": 123,
        "itemName": "Paracetamol",
        "isOptimal": false,
        "currentActiveBatches": [...],
        "recommendedActiveBatch": {
          "id": 456,
          "batchNumber": "ACE-004",
          "expiryDate": "1/10/2026",
          "quantity": 100,
          "isCurrentlyActive": false
        },
        "totalBatches": 3,
        "activeBatchesCount": 1,
        "inactiveBatchesCount": 2
      }
    ],
    "summary": {
      "totalItems": 10,
      "optimalItems": 8,
      "needsOptimization": 2
    }
  }
}
```

### POST /api/admin/inventory/optimize-batches
**Optimize batch activation**

Request Body:
```json
{
  "itemId": 123,  // Single item
  // OR
  "itemIds": [123, 124, 125],  // Multiple items
  "action": "optimize"  // or "activate_next"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "itemId": 123,
        "success": true,
        "message": "Optimized batch activation - activated batch with earliest expiry",
        "previousActiveBatches": [...],
        "newActiveBatch": {
          "id": 456,
          "batchNumber": "ACE-004",
          "expiryDate": "1/10/2026"
        }
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  }
}
```

## Batch Activation Logic

### Scenario 1: Multiple Batches with Different Expiry Dates
```
Batch ACE-002: Created 2025-12-01, Expires 2026-02-15, Status: ACTIVE
Batch ACE-004: Created 2025-12-15, Expires 2026-01-10, Status: INACTIVE

System Action: 
- Deactivates ACE-002 (later expiry)
- Activates ACE-004 (earlier expiry)
```

### Scenario 2: Active Batch Expires
```
Batch ACE-002: Expires 2026-01-03, Status: ACTIVE → EXPIRED
Batch ACE-004: Expires 2026-01-10, Status: INACTIVE

System Action:
- Marks ACE-002 as EXPIRED
- Activates ACE-004 (next earliest expiry)
```

### Scenario 3: Active Batch Sold Out (Damage/Sale)
```
Batch ACE-002: Quantity becomes 0, Status: ACTIVE → SOLD_OUT
Batch ACE-004: Expires 2026-01-10, Status: INACTIVE

System Action:
- Marks ACE-002 as SOLD_OUT
- Activates ACE-004 (next available batch by expiry date)
```

## Utility Functions

### `optimizeBatchActivation(itemId)`
Ensures the batch with earliest expiry date is active for an item.

### `activateNextBestBatch(itemId)`
Activates the next best available batch (earliest expiry, then earliest creation).

### `checkAndUpdateExpiredBatches(itemId?)`
Enhanced function that:
1. Marks expired batches as EXPIRED
2. Activates replacement batches when active batches expire
3. Optimizes batch activation for affected items

## Usage Examples

### 1. Check and optimize specific item
```javascript
const response = await fetch('/api/admin/inventory/123/batches');
const data = await response.json();

// Check optimization results
if (data.data.expiryUpdateResult.activationResults) {
  data.data.expiryUpdateResult.activationResults.forEach(result => {
    if (result.success && result.activatedBatch) {
      console.log(`✅ Activated batch ${result.activatedBatch.batchNumber} for ${result.itemName}`);
    }
  });
}
```

### 2. Get optimization recommendations
```javascript
const response = await fetch('/api/admin/inventory/optimize-batches');
const data = await response.json();

// Show items needing optimization
data.data.recommendations.forEach(item => {
  if (!item.isOptimal) {
    console.log(`⚠️ ${item.itemName} needs optimization`);
    console.log(`Current: ${item.currentActiveBatches[0]?.batchNumber}`);
    console.log(`Recommended: ${item.recommendedActiveBatch.batchNumber}`);
  }
});
```

### 3. Optimize multiple items
```javascript
const response = await fetch('/api/admin/inventory/optimize-batches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    itemIds: [123, 124, 125],
    action: 'optimize'
  })
});
```

## Best Practices

1. **FIFO Implementation**: The system automatically implements First-Expiry-First-Out (FEFO) logic
2. **Regular Optimization**: Run batch optimization periodically to ensure optimal activation
3. **Monitor Expiry Warnings**: Use expiry warning APIs to prevent stock wastage
4. **Dashboard Integration**: Show batch optimization status in admin dashboards
5. **Automated Workflows**: Set up cron jobs for regular expiry checks and optimization
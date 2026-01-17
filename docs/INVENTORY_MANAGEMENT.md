# Inventory Management System

## Overview

The inventory management system tracks product quantities across different batch statuses and ensures accurate stock levels by properly handling batch expiry, sales, and inventory synchronization.

## Key Components

### 1. Batch Status Management

Batches have four possible statuses:
- **ACTIVE**: Available for immediate sale
- **INACTIVE**: In stock but not currently being sold (FIFO queue)
- **EXPIRED**: Past expiry date, cannot be sold
- **SOLD_OUT**: Quantity reduced to 0 through sales

### 2. Inventory Quantities

The inventory table tracks three key quantities:
- **totalQuantity**: Sum of ACTIVE + INACTIVE batch quantities (excludes expired/sold out)
- **availableQuantity**: Sum of ACTIVE batch quantities only (immediately sellable)
- **reservedQuantity**: Sum of INACTIVE batch quantities (batches waiting to be activated)

### 3. Batch Expiry Handling

When batches expire:
1. Batch status changes from ACTIVE/INACTIVE to EXPIRED
2. Inventory quantities are automatically updated to exclude expired quantities
3. If an ACTIVE batch expires, the next best batch (earliest expiry) is activated
4. Inventory sync ensures all quantities reflect actual batch data

### 4. Sales Impact

When products are sold:
1. Quantities are deducted from ACTIVE batches using FIFO logic
2. Batches with 0 quantity become SOLD_OUT
3. Inventory quantities are updated accordingly
4. Next inactive batch is activated if needed

## Files and Functions

### Core Files

- `src/lib/batch-expiry-utils.ts` - Handles batch expiry logic and activation
- `src/lib/inventory-sync-utils.ts` - Syncs inventory quantities with batch data
- `src/lib/inventory-utils.ts` - Handles sales deductions and inventory updates
- `src/lib/cron-service.ts` - Scheduled tasks for batch expiry checks

### Key Functions

#### Batch Expiry
- `checkAndUpdateExpiredBatches()` - Marks expired batches and updates inventory
- `activateNextBestBatch()` - Activates the next available batch
- `optimizeBatchActivation()` - Ensures earliest expiry batch is active

#### Sales Processing
- `deductFromInventory()` - Handles sales deductions using FIFO
- `addBackToInventory()` - Reverses deductions for returns

## API Endpoints

### Batch Expiry
- `POST /api/admin/inventory/check-expiry` - Manually check and update expired batches

## Automated Tasks

### Daily Batch Expiry Check
Runs every day at midnight:
1. Identifies expired batches
2. Updates batch status to EXPIRED
3. Activates replacement batches
4. Updates inventory quantities automatically

## Troubleshooting

### Common Issues

1. **Expired batches still showing as available**
   - Run expiry check: `POST /api/admin/inventory/check-expiry`
   - Check cron job status

2. **Wrong batch being sold from**
   - Check batch activation optimization
   - Ensure FIFO logic is working correctly

### Scripts

- `scripts/check-batch-status.ts` - Check batch status and expiry
- `scripts/update-expired-batches.ts` - Manually update expired batches

## Best Practices

1. **Regular Monitoring**
   - Monitor batch expiry warnings
   - Verify FIFO batch activation

2. **Data Integrity**
   - Use transactions for multi-step operations
   - Validate quantities before and after sales

3. **Performance**
   - Batch database operations when possible
   - Use indexes for batch queries
   - Limit active batches per item

## Quantity Calculation Logic

### Total Available Quantity
```
Total = Sum of (ACTIVE batches) + Sum of (INACTIVE batches)
```

### Available for Sale
```
Available = Sum of (ACTIVE batches only)
```

### Reserved Quantity
```
Reserved = Sum of (INACTIVE batches only)
```

### Expired Quantity Tracking
```
Expired = Sum of (EXPIRED batches)
```

### Sold Quantity Tracking
```
Sold = Count of (SOLD_OUT batches) + Quantity reductions from partial sales
```

## Integration Points

### Sales System
- Deducts from inventory using FIFO
- Updates batch quantities and status
- Activates next batches as needed

### Purchase System
- Adds new batches as INACTIVE
- Updates inventory totals
- Optimizes batch activation

### Reporting System
- Uses accurate inventory quantities
- Tracks expired vs sold quantities
- Provides batch-level details

## Monitoring and Alerts

### Expiry Warnings
Batches approaching expiry are flagged for attention, allowing proactive management.

### Stock Levels
Real-time stock status based on actual available quantities, considering expired and sold batches.
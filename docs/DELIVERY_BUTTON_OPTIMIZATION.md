# Delivery Button Optimization

## Issue
When clicking the delivery button (bicycle icon) to mark an order as "DELIVERED", the entire list was showing a loading state and the status update wasn't immediately visible.

## Solution
Implemented optimistic UI updates with per-button loading states.

## Changes Made

### 1. OnlineOrderList Component (`src/components/Delivery Management/OnlineOrderList.tsx`)

**Added State:**
```typescript
const [deliveringOrderId, setDeliveringOrderId] = useState<number | null>(null);
```

**Updated handleDeliverOrder:**
```typescript
const handleDeliverOrder = async (order: DeliveryItem) => {
  setDeliveringOrderId(order.id); // Set loading state for this specific order
  try {
    await updateDeliveryStatus(order.id, "DELIVERED");
    // Status is updated in the store immediately, no need to refresh
  } catch (err) {
    console.error("Failed to deliver order:", err);
  } finally {
    setDeliveringOrderId(null); // Clear loading state
  }
};
```

**Updated Delivery Button:**
```typescript
<button
  onClick={() => handleDeliverOrder(row)}
  disabled={deliveringOrderId === row.id}
  aria-label="Deliver Order"
  className={`flex items-center gap-2 rounded-xl p-2 font-medium text-white transition-colors focus:ring-2 focus:ring-[#059669] focus:outline-none ${
    deliveringOrderId === row.id
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-[#059669] hover:bg-emerald-700"
  }`}
>
  <IoBicycleOutline className="h-5 w-5" />                    
</button>
```

### 2. Delivery Store (`src/stores/deliveryStore.ts`)

**Updated updateDeliveryStatus:**
```typescript
updateDeliveryStatus: async (id, status) => {
  try {
    const response = await axios.put(`/api/counter/deliveries/${id}/status`, {
      deliveryStatus: status, 
    });
    const updatedDelivery = response.data;
    
    // Update the delivery in the local state immediately
    set((state) => ({
      deliveries: state.deliveries.map((d) =>
        d.id === id ? { ...d, deliveryStatus: updatedDelivery.deliveryStatus, updatedAt: updatedDelivery.updatedAt } : d
      ),
    }));

  } catch (err: any) {
    console.log("API error response:", err.response?.data);
    set({ error: err.message || "Failed to update delivery status" });
    throw err; // Re-throw to handle in component
  }
},
```

**Key Changes:**
- Removed global `loading` state from this function
- Fixed field mapping: `updatedDelivery.deliveryStatus` instead of `updatedDelivery.status`
- Updates local state immediately after API call
- Re-throws error for component-level handling

## Benefits

1. **No List Reload**: The entire list doesn't show a loading state
2. **Immediate Feedback**: Status updates appear instantly in the UI
3. **Button Disabled**: The specific delivery button is disabled during the update
4. **Visual Feedback**: Button changes to gray with cursor-not-allowed when processing
5. **Optimistic UI**: Users see the change immediately without waiting for a full page refresh

## User Experience Flow

1. User clicks the delivery button (bicycle icon)
2. Button immediately becomes disabled and turns gray
3. API call is made to update the status
4. Local state is updated immediately with the new status
5. The order's delivery status badge changes from "IN_TRANSIT" (blue) to "DELIVERED" (green)
6. Button loading state is cleared
7. The "Return" button appears for the delivered order

## Testing

- [ ] Click delivery button on an IN_TRANSIT order
- [ ] Verify button becomes disabled and gray during update
- [ ] Verify status badge changes immediately to DELIVERED (green)
- [ ] Verify no full list reload occurs
- [ ] Verify other orders remain interactive during update
- [ ] Verify Return button appears after delivery
- [ ] Test with slow network to see loading state clearly

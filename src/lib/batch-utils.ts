/**
 * Utility functions for batch expiry and availability checks
 */

/**
 * Check if a batch is expired based on its expiry date
 * @param expiryDate - The expiry date string or null
 * @returns boolean indicating if the batch is expired
 */
export const isBatchExpired = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false; // No expiry date means it doesn't expire
  
  // Get current date in local timezone (not UTC)
  const currentDate = new Date();
  // Reset time to start of day in local timezone
  const currentDateLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const expiry = new Date(expiryDate);
  // Reset expiry time to start of day in local timezone
  const expiryLocal = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  
  // Batch expires the day AFTER the expiry date
  // So if today > expiry date, then it's expired
  return expiryLocal < currentDateLocal;
};

/**
 * Check if a batch is active and not expired
 * @param batch - The batch object with status, quantity, remainingTablets, and expiryDate
 * @returns boolean indicating if the batch is available for sale
 */
export const isBatchAvailableForSale = (batch: any): boolean => {
  // Check if batch is active and has stock
  const isActiveWithStock = batch.status === "ACTIVE" && 
    (batch.quantity > 0 || (batch.remainingTablets && batch.remainingTablets > 0));
  
  if (!isActiveWithStock) return false;
  
  // If batch status is already EXPIRED, it's not available
  if (batch.status === "EXPIRED") return false;
  
  // Check if batch is not expired based on expiry date
  return !isBatchExpired(batch.expiryDate);
};

/**
 * Check if a product has any batches available for sale (active and not expired)
 * @param product - Product object with batches array
 * @returns boolean indicating if the product has available batches
 */
export const hasAvailableBatches = (product: { batches?: any[] }): boolean => {
  if (!product.batches) return false;
  return product.batches.some(batch => isBatchAvailableForSale(batch));
};
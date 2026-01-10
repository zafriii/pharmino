import prisma from "@/lib/prisma";
import { BatchDeduction } from "@/lib/inventory-utils";
import { TabletInventoryDeduction } from '../types/tablet-sale.types';
import { calculateStripImpact } from './tablet-calculation.utils';

export interface TabletInventoryUpdateResult {
  success: boolean;
  batchDeductions: BatchDeduction[];
  tabletDeductions: TabletInventoryDeduction[];
  remainingQuantity: number;
  error?: string;
}

/**
 * Calculate total available tablets including partial strips
 * @param batches - Array of product batches
 * @param tabletsPerStrip - Number of tablets per strip
 * @returns Total available tablets
 */
export function calculateTotalAvailableTablets(
  batches: Array<{ quantity: number; remainingTablets?: number | null }>,
  tabletsPerStrip: number
): number {
  return batches.reduce((total, batch) => {
    const completeStripTablets = batch.quantity * tabletsPerStrip;
    const partialStripTablets = batch.remainingTablets || 0;
    return total + completeStripTablets + partialStripTablets;
  }, 0);
}

/**
 * Deduct tablets from inventory using FIFO logic with partial strip tracking
 * @param itemId - Product ID
 * @param tabletsToDeduct - Number of tablets to deduct
 * @param tabletsPerStrip - Number of tablets per strip
 * @param tx - Prisma transaction client (optional)
 * @returns Promise<TabletInventoryUpdateResult>
 */
export async function deductTabletsFromInventory(
  itemId: number,
  tabletsToDeduct: number,
  tabletsPerStrip: number,
  tx?: any
): Promise<TabletInventoryUpdateResult> {
  console.log("deductTabletsFromInventory called:", { itemId, tabletsToDeduct, tabletsPerStrip });
  
  const client = tx || prisma;

  try {
    // Get only ACTIVE batches for the item, sorted by expiry date (FIFO)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableBatches = await client.productBatch.findMany({
      where: {
        itemId,
        OR: [
          { quantity: { gt: 0 } }, // Complete strips available
          { remainingTablets: { gt: 0 } } // Partial strips available
        ],
        status: 'ACTIVE',
        AND: [
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: today } }
            ]
          }
        ]
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (availableBatches.length === 0) {
      return {
        success: false,
        batchDeductions: [],
        tabletDeductions: [],
        remainingQuantity: tabletsToDeduct,
        error: "No active batches available for sale"
      };
    }

    // Calculate total available tablets including partial strips
    const totalAvailableTablets = calculateTotalAvailableTablets(availableBatches, tabletsPerStrip);
    
    if (totalAvailableTablets < tabletsToDeduct) {
      return {
        success: false,
        batchDeductions: [],
        tabletDeductions: [],
        remainingQuantity: tabletsToDeduct - totalAvailableTablets,
        error: `Insufficient tablets. Available: ${totalAvailableTablets}, Required: ${tabletsToDeduct}`
      };
    }

    const batchDeductions: BatchDeduction[] = [];
    const tabletDeductions: TabletInventoryDeduction[] = [];
    const batchUpdates: Array<{ id: number; quantity: number; remainingTablets: number | null; status: string }> = [];
    const batchesToActivate: number[] = [];
    let remainingTabletsToDeduct = tabletsToDeduct;

    // Calculate all deductions first (no DB calls in loop)
    for (const batch of availableBatches) {
      if (remainingTabletsToDeduct <= 0) break;

      // Calculate available tablets in this batch (complete strips + partial strip)
      const completeStripTablets = batch.quantity * tabletsPerStrip;
      const partialStripTablets = batch.remainingTablets || 0;
      const availableTabletsInBatch = completeStripTablets + partialStripTablets;
      
      const tabletsFromThisBatch = Math.min(availableTabletsInBatch, remainingTabletsToDeduct);
      
      console.log("Batch deduction calculation:", {
        batchId: batch.id,
        completeStrips: batch.quantity,
        partialTablets: batch.remainingTablets,
        availableTabletsInBatch,
        tabletsFromThisBatch,
        remainingTabletsToDeduct
      });

      let newQuantity = batch.quantity;
      let newRemainingTablets = batch.remainingTablets;
      let stripsToDeduct = 0;

      if (partialStripTablets > 0 && tabletsFromThisBatch <= partialStripTablets) {
        // Taking from partial strip only
        newRemainingTablets = partialStripTablets - tabletsFromThisBatch;
        if (newRemainingTablets === 0) {
          newRemainingTablets = null; // Convert back to complete strip
        }
        stripsToDeduct = 0;
      } else if (partialStripTablets > 0) {
        // Taking all partial tablets + some from complete strips
        const tabletsFromCompleteStrips = tabletsFromThisBatch - partialStripTablets;
        const stripImpact = calculateStripImpact(tabletsFromCompleteStrips, tabletsPerStrip);
        
        stripsToDeduct = stripImpact.stripsAffected;
        newQuantity = batch.quantity - stripsToDeduct;
        newRemainingTablets = stripImpact.remainingTabletsInLastStrip > 0 ? stripImpact.remainingTabletsInLastStrip : null;
      } else {
        // Taking from complete strips only
        const stripImpact = calculateStripImpact(tabletsFromThisBatch, tabletsPerStrip);
        stripsToDeduct = stripImpact.stripsAffected;
        newQuantity = batch.quantity - stripsToDeduct;
        newRemainingTablets = stripImpact.remainingTabletsInLastStrip > 0 ? stripImpact.remainingTabletsInLastStrip : null;
      }

      const newStatus = (newQuantity === 0 && !newRemainingTablets) ? 'SOLD_OUT' : batch.status;

      batchUpdates.push({
        id: batch.id,
        quantity: newQuantity,
        remainingTablets: newRemainingTablets,
        status: newStatus
      });

      batchDeductions.push({
        batchId: batch.id,
        quantity: stripsToDeduct
      });

      tabletDeductions.push({
        batchId: batch.id,
        tabletsDeducted: tabletsFromThisBatch,
        stripsAffected: stripsToDeduct,
        remainingTabletsInStrip: newRemainingTablets || 0
      });

      remainingTabletsToDeduct -= tabletsFromThisBatch;

      // Track batches that need activation
      if (newQuantity === 0 && !newRemainingTablets && batch.status === 'ACTIVE') {
        batchesToActivate.push(itemId);
      }
    }

    // Perform all batch updates with new remainingTablets field
    const soldOutBatches = batchUpdates.filter((b: { status: string }) => b.status === 'SOLD_OUT');
    const activeBatches = batchUpdates.filter((b: { status: string }) => b.status === 'ACTIVE');

    // Update sold out batches
    if (soldOutBatches.length > 0) {
      await Promise.all(soldOutBatches.map(batch =>
        client.productBatch.update({
          where: { id: batch.id },
          data: { 
            quantity: batch.quantity, 
            remainingTablets: batch.remainingTablets,
            status: 'SOLD_OUT' 
          }
        })
      ));
    }

    // Update active batches
    if (activeBatches.length > 0) {
      await Promise.all(activeBatches.map(batch =>
        client.productBatch.update({
          where: { id: batch.id },
          data: { 
            quantity: batch.quantity,
            remainingTablets: batch.remainingTablets
          }
        })
      ));
    }

    // Activate next inactive batches if needed
    if (batchesToActivate.length > 0) {
      const inactiveBatches = await client.productBatch.findMany({
        where: {
          itemId,
          status: 'INACTIVE',
          quantity: { gt: 0 }
        },
        orderBy: [
          { expiryDate: 'asc' },
          { createdAt: 'asc' }
        ],
        take: batchesToActivate.length
      });

      if (inactiveBatches.length > 0) {
        await client.productBatch.updateMany({
          where: {
            id: { in: inactiveBatches.map((b: any) => b.id) }
          },
          data: { status: 'ACTIVE' }
        });
      }
    }

    // Update inventory record - for tablet sales, we need special handling
    const inventory = await client.inventory.findUnique({
      where: { productId: itemId }
    });

    if (inventory) {
      // For tablet sales, we still deduct strips but need to track remaining tablets
      const totalStripsDeducted = batchDeductions.reduce((sum, bd) => sum + bd.quantity, 0);
      const newTotalQuantity = inventory.totalQuantity - totalStripsDeducted;
      const newAvailableQuantity = inventory.availableQuantity - totalStripsDeducted;

      // Calculate status based on remaining tablets for tablet products
      let newStatus = inventory.status;
      
      // Get updated batches to calculate total remaining tablets
      const updatedBatches = await client.productBatch.findMany({
        where: { 
          itemId,
          OR: [
            { quantity: { gt: 0 } },
            { remainingTablets: { gt: 0 } }
          ]
        }
      });
      
      const totalRemainingTablets = updatedBatches.reduce((sum: number, batch: any) => {
        const completeStripTablets = batch.quantity * tabletsPerStrip;
        const partialTablets = batch.remainingTablets || 0;
        return sum + completeStripTablets + partialTablets;
      }, 0);
      
      if (totalRemainingTablets === 0) {
        newStatus = 'OUT_OF_STOCK';
      } else {
        // Convert tablets to equivalent strips for threshold comparison
        const equivalentStrips = Math.floor(totalRemainingTablets / tabletsPerStrip);
        if (equivalentStrips < inventory.lowStockThreshold) {
          newStatus = 'LOW_STOCK';
        } else {
          newStatus = 'IN_STOCK';
        }
      }

      await client.inventory.update({
        where: { productId: itemId },
        data: {
          totalQuantity: newTotalQuantity,
          availableQuantity: newAvailableQuantity,
          status: newStatus,
          lastUpdated: new Date()
        }
      });
    }

    return {
      success: true,
      batchDeductions,
      tabletDeductions,
      remainingQuantity: 0
    };

  } catch (error) {
    console.error("Error deducting tablets from inventory:", error);
    return {
      success: false,
      batchDeductions: [],
      tabletDeductions: [],
      remainingQuantity: tabletsToDeduct,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Add tablets back to inventory (for returns) with partial strip support
 * @param tabletDeductions - Array of tablet deductions to reverse
 * @param tabletsPerStrip - Number of tablets per strip
 * @param tx - Prisma transaction client (optional)
 */
export async function addTabletsBackToInventory(
  tabletDeductions: TabletInventoryDeduction[],
  tabletsPerStrip: number,
  tx?: any
): Promise<boolean> {
  const client = tx || prisma;

  try {
    // Get all batches at once
    const batchIds = tabletDeductions.map(d => d.batchId);
    const batches = await client.productBatch.findMany({
      where: { id: { in: batchIds } }
    });

    // Group deductions by itemId for inventory updates
    const inventoryUpdates = new Map<number, number>();
    const batchUpdates = [];

    for (const deduction of tabletDeductions) {
      const batch = batches.find((b: any) => b.id === deduction.batchId);
      if (batch) {
        // Add tablets back - this is complex as we need to reconstruct partial strips
        const tabletsToAdd = deduction.tabletsDeducted;
        const currentCompleteTablets = batch.quantity * tabletsPerStrip;
        const currentPartialTablets = batch.remainingTablets || 0;
        const totalCurrentTablets = currentCompleteTablets + currentPartialTablets;
        const newTotalTablets = totalCurrentTablets + tabletsToAdd;
        
        const newCompleteStrips = Math.floor(newTotalTablets / tabletsPerStrip);
        const newRemainingTablets = newTotalTablets % tabletsPerStrip;
        
        batchUpdates.push({
          id: batch.id,
          quantity: newCompleteStrips,
          remainingTablets: newRemainingTablets > 0 ? newRemainingTablets : null,
          status: batch.status === 'SOLD_OUT' ? 'ACTIVE' : batch.status
        });

        // Accumulate inventory updates by itemId (in strips)
        const stripsAdded = newCompleteStrips - batch.quantity;
        const currentUpdate = inventoryUpdates.get(batch.itemId) || 0;
        inventoryUpdates.set(batch.itemId, currentUpdate + stripsAdded);
      }
    }

    // Batch update all product batches
    await Promise.all(
      batchUpdates.map(update =>
        client.productBatch.update({
          where: { id: update.id },
          data: { 
            quantity: update.quantity, 
            remainingTablets: update.remainingTablets,
            status: update.status 
          }
        })
      )
    );

    // Batch update all inventory records
    const inventoryPromises = Array.from(inventoryUpdates.entries()).map(async ([itemId, stripsToAdd]) => {
      const inventory = await client.inventory.findUnique({
        where: { productId: itemId }
      });

      if (inventory) {
        const newTotalQuantity = inventory.totalQuantity + stripsToAdd;
        const newAvailableQuantity = inventory.availableQuantity + stripsToAdd;

        let newStatus = inventory.status;
        if (newTotalQuantity >= inventory.lowStockThreshold) {
          newStatus = 'IN_STOCK';
        } else if (newTotalQuantity > 0) {
          newStatus = 'LOW_STOCK';
        }

        return client.inventory.update({
          where: { productId: itemId },
          data: {
            totalQuantity: newTotalQuantity,
            availableQuantity: newAvailableQuantity,
            status: newStatus,
            lastUpdated: new Date()
          }
        });
      }
    });

    await Promise.all(inventoryPromises.filter(Boolean));

    return true;
  } catch (error) {
    console.error("Error adding tablets back to inventory:", error);
    return false;
  }
}
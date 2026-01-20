import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/inventory - Get all inventory items with stock information
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const stockStatus = searchParams.get('stockStatus');
    const itemStatus = searchParams.get('itemStatus');
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get('search');

    const where: any = {};
    if (itemStatus) where.status = itemStatus;
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.product.count({ where });

    const items = await prisma.product.findMany({
      where,
      include: {
        category: true,
        batches: {
          where: {
            status: { not: 'SOLD_OUT' }
          },
          orderBy: { expiryDate: 'asc' }
        },
        inventory: {
          include: {
            batches: {
              where: {
                status: { not: 'SOLD_OUT' }
              },
              orderBy: { expiryDate: 'asc' }
            }
          }
        }
      },
      orderBy: { itemName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stock information for each item
    const inventoryItems = items.map(item => {
      // Get inventory record for proper quantity tracking
      const inventoryRecord = item.inventory;

      // Calculate batch-based quantities
      let totalBatchStock = 0;
      let totalTablets = 0;
      let activeBatchStock = 0;
      let inactiveBatchStock = 0;

      if (item.tabletsPerStrip) {
        // For tablet products, calculate both strips and tablets
        totalBatchStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
        totalTablets = item.batches.reduce((sum, batch) => {
          const completeStripTablets = batch.quantity * item.tabletsPerStrip!;
          const partialTablets = batch.remainingTablets || 0;
          return sum + completeStripTablets + partialTablets;
        }, 0);

        // Calculate active and inactive batch quantities
        activeBatchStock = item.batches
          .filter(batch => batch.status === 'ACTIVE')
          .reduce((sum, batch) => sum + batch.quantity, 0);
        inactiveBatchStock = item.batches
          .filter(batch => batch.status === 'INACTIVE')
          .reduce((sum, batch) => sum + batch.quantity, 0);
      } else {
        // For non-tablet products, use regular calculation
        totalBatchStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);

        // Calculate active and inactive batch quantities
        activeBatchStock = item.batches
          .filter(batch => batch.status === 'ACTIVE')
          .reduce((sum, batch) => sum + batch.quantity, 0);
        inactiveBatchStock = item.batches
          .filter(batch => batch.status === 'INACTIVE')
          .reduce((sum, batch) => sum + batch.quantity, 0);
      }

      const activeBatches = item.batches.filter(batch => batch.status === 'ACTIVE');
      const inactiveBatches = item.batches.filter(batch => batch.status === 'INACTIVE');

      // Use inventory record quantities if available, otherwise fall back to batch calculations
      const totalQuantity = inventoryRecord?.totalQuantity ?? totalBatchStock;
      const availableQuantity = inventoryRecord?.availableQuantity ?? activeBatchStock;
      const reservedQuantity = inventoryRecord?.reservedQuantity ?? inactiveBatchStock;

      let stockStatus = 'OUT_OF_STOCK';

      // Fix stock status calculation for tablet products
      if (item.tabletsPerStrip) {
        // For tablet products, use total tablets for status calculation
        if (totalTablets > 0) {
          // Convert tablets to equivalent strips for threshold comparison
          const equivalentStrips = Math.floor(totalTablets / item.tabletsPerStrip);
          stockStatus = equivalentStrips >= item.lowStockThreshold ? 'IN_STOCK' : 'LOW_STOCK';

          // If we have partial tablets but no complete strips, still show as IN_STOCK if tablets available
          if (equivalentStrips === 0 && totalTablets > 0) {
            stockStatus = 'LOW_STOCK'; // Partial tablets available
          }
        }
      } else {
        // For non-tablet products, use available quantity for status calculation
        if (availableQuantity > 0) {
          stockStatus = availableQuantity >= item.lowStockThreshold ? 'IN_STOCK' : 'LOW_STOCK';
        }
      }

      return {
        id: item.id,
        itemName: item.itemName,
        imageUrl: item.imageUrl,
        genericName: item.genericName,
        brand: item.brand,
        strength: item.strength,
        category: item.category,
        rackLocation: item.rackLocation,
        lowStockThreshold: item.lowStockThreshold,
        sellingPrice: item.sellingPrice,
        status: item.status,
        tabletsPerStrip: item.tabletsPerStrip,
        totalStock: totalQuantity,
        availableStock: availableQuantity,
        reservedStock: reservedQuantity,
        totalTablets: item.tabletsPerStrip ? totalTablets : undefined,
        stockStatus,
        activeBatchesCount: activeBatches.length,
        inactiveBatchesCount: inactiveBatches.length,
        totalBatchesCount: item.batches.length,
        inventory: item.inventory,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    // Filter by stock status if provided
    const filteredItems = stockStatus
      ? inventoryItems.filter(item => item.stockStatus === stockStatus)
      : inventoryItems;

    return successResponse({
      inventory: filteredItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }
    console.error("Error fetching inventory:", error);
    return errorResponse("Failed to fetch inventory", 500);
  }
}
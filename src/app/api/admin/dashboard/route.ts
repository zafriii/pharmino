import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requirePharmacyOrAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/pharmacy-dashboard - Get pharmacy dashboard statistics
export async function GET(request: NextRequest) {
  try {
    await requirePharmacyOrAdmin();

    const [
      totalItems,
      totalCategories,
      lowStockItems,
      outOfStockItems,
      expiredBatches,
      todaySales,
      pendingPurchases,
      receivedItems
    ] = await Promise.all([
      // Total active items
      prisma.product.count({
        where: { status: 'ACTIVE' }
      }),

      // Total categories (using existing categories table)
      prisma.category.count(),

      // Low stock items
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          batches: {
            where: {
              status: { in: ['ACTIVE', 'INACTIVE'] },
              quantity: { gt: 0 }
            }
          }
        }
      }).then(items => {
        return items.filter(item => {
          const totalStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
          return totalStock > 0 && totalStock < item.lowStockThreshold;
        }).length;
      }),

      // Out of stock items
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          batches: {
            where: {
              status: { in: ['ACTIVE', 'INACTIVE'] },
              quantity: { gt: 0 }
            }
          }
        }
      }).then(items => {
        return items.filter(item => {
          const totalStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
          return totalStock === 0;
        }).length;
      }),

      // Expired batches (not yet marked as expired)
      prisma.productBatch.count({
        where: {
          expiryDate: { lt: new Date() },
          status: { not: 'EXPIRED' }
        }
      }),

      // Today's sales
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'COMPLETED'
        },
        _sum: { grandTotal: true },
        _count: true
      }),

      // Pending purchases
      prisma.purchaseOrder.count({
        where: { status: 'LISTED' }
      }),

      // Items ready for stock entry
      prisma.receivedItem.findMany({
        include: {
          batches: true
        }
      }).then(items => {
        return items.filter(item => {
          const totalBatchQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
          return totalBatchQuantity < item.receivedQuantity;
        }).length;
      })
    ]);

    // Get recent sales for trend
    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        status: 'COMPLETED'
      },
      select: {
        grandTotal: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate weekly sales
    const weeklyTotal = recentSales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);

    const dashboardStats = {
      inventory: {
        totalItems,
        totalCategories,
        lowStockItems,
        outOfStockItems,
        expiredBatches
      },
      sales: {
        todayCount: todaySales._count,
        todayAmount: Number(todaySales._sum.grandTotal || 0),
        weeklyAmount: weeklyTotal,
        recentSalesCount: recentSales.length
      },
      purchases: {
        pendingOrders: pendingPurchases,
        itemsToStock: receivedItems
      },
      alerts: {
        lowStock: lowStockItems > 0,
        outOfStock: outOfStockItems > 0,
        expired: expiredBatches > 0,
        pendingStock: receivedItems > 0
      }
    };

    return successResponse(dashboardStats);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
    }
    console.error("Error fetching pharmacy dashboard:", error);
    return errorResponse("Failed to fetch pharmacy dashboard", 500);
  }
}
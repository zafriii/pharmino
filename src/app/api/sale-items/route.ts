import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireEvery, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/admin/pharmacy-pos-items - Get items for POS (only items with available stock)
export async function GET(request: NextRequest) {
  try {
    await requireEvery();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {
      status: 'ACTIVE',
      batches: {
        some: {
          status: { in: ['ACTIVE', 'INACTIVE'] },
          OR: [
            { quantity: { gt: 0 } },
            { remainingTablets: { gt: 0 } }
          ]
        }
      }
    };

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.product.findMany({
      where,
      include: {
        category: true,
        batches: {
          where: {
            status: { in: ['ACTIVE', 'INACTIVE'] },
            OR: [
              { quantity: { gt: 0 } },
              { remainingTablets: { gt: 0 } }
            ]
          },
          orderBy: { expiryDate: 'asc' }
        }
      },
      orderBy: { itemName: 'asc' }
    });

    // Format items for POS display
    const posItems = items.map(item => {
      let totalStock = 0;
      let totalTablets = 0;
      
      if (item.tabletsPerStrip) {
        // For tablet products, calculate both strips and tablets
        totalStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
        totalTablets = item.batches.reduce((sum, batch) => {
          const completeStripTablets = batch.quantity * item.tabletsPerStrip!;
          const partialTablets = batch.remainingTablets || 0;
          return sum + completeStripTablets + partialTablets;
        }, 0);
      } else {
        // For non-tablet products, use regular calculation
        totalStock = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      }
      
      // Calculate prices
      const pricePerTablet = item.sellingPrice ? Number(item.sellingPrice) : 0;
      let pricePerStrip = null;
      
      if (item.tabletsPerStrip && item.tabletsPerStrip > 0 && pricePerTablet > 0) {
        pricePerStrip = pricePerTablet * item.tabletsPerStrip;
      }

      return {
        id: item.id,
        itemName: item.itemName,
        genericName: item.genericName,
        brand: item.brand,
        strength: item.strength,
        category: item.category,
        availableStock: item.tabletsPerStrip ? totalTablets : totalStock, // Show tablets for tablet products
        baseUnit: item.baseUnit,
        tabletsPerStrip: item.tabletsPerStrip,
        pricePerTablet: pricePerTablet,
        pricePerStrip: pricePerStrip,
        sellingPrice: item.sellingPrice,
        sellTypes: item.tabletsPerStrip ? ['FULL_STRIP', 'SINGLE_TABLET'] : ['SINGLE_TABLET']
      };
    });

    return successResponse(posItems);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
    }
    console.error("Error fetching POS items:", error);
    return errorResponse("Failed to fetch POS items", 500);
  }
}
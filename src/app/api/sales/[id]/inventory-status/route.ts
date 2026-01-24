import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";

// GET /api/sales/[id]/inventory-status - Check if sale items have been restored to inventory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if there's an audit log entry for inventory restoration
    const inventoryRestoreLog = await prisma.auditLog.findFirst({
      where: {
        action: "RESTORE_TO_INVENTORY",
        entity: "PharmacySale",
        entityId: id
      }
    });

    return successResponse({
      isRestored: !!inventoryRestoreLog,
      restoredAt: inventoryRestoreLog?.createdAt || null
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Pharmacy access required", 403);
      }
    }
    console.error("Error checking inventory status:", error);
    return errorResponse("Failed to check inventory status", 500);
  }
}
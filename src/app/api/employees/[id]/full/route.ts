import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET /api/admin/employees/[id]/full - Get employee full profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        dutyType: true,
        shift: true,
        joiningDate: true,
        monthlySalary: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 days
          select: {
            id: true,
            date: true,
            status: true,
            createdAt: true,
          },
        },
        payrolls: {
          orderBy: { createdAt: "desc" },
          take: 12, // Last 12 months
          select: {
            id: true,
            baseSalary: true,
            allowances: true,
            deductions: true,
            netPay: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 50, // Last 50 activities
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    // Attendance statistics
    const attendanceStats = {
      present: employee.attendances.filter((a) => a.status === "PRESENT").length,
      absent: employee.attendances.filter((a) => a.status === "ABSENT").length,
      late: employee.attendances.filter((a) => a.status === "LATE").length,
      total: employee.attendances.length,
    };

    // Payroll statistics
    const totalEarned = employee.payrolls
      .filter((p) => p.paymentStatus === "PAID")
      .reduce((sum, p) => sum + Number(p.netPay), 0);

    const totalPending = employee.payrolls
      .filter((p) => p.paymentStatus === "PENDING")
      .reduce((sum, p) => sum + Number(p.netPay), 0);

    return successResponse({
      employee: {
        ...employee,
        statistics: {
          attendance: attendanceStats,
          payroll: {
            totalEarned,
            totalPending,
            paidCount: employee.payrolls.filter(
              (p) => p.paymentStatus === "PAID"
            ).length,
            pendingCount: employee.payrolls.filter(
              (p) => p.paymentStatus === "PENDING"
            ).length,
          },
          activityCount: employee.auditLogs.length,
        },
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

    console.error("Error fetching employee full profile:", error);
    return errorResponse("Internal server error", 500);
  }
}

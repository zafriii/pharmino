import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

// Validation schema 
const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

// GET /api/attendance/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const attendanceId = parseInt(id);

    if (isNaN(attendanceId)) {
      return errorResponse("Invalid attendance ID", 400);
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!attendance) {
      return errorResponse("Attendance record not found", 404);
    }

    return successResponse({ attendance });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }

    console.error("Error fetching attendance:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT /api/attendance/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const attendanceId = parseInt(id);

    if (isNaN(attendanceId)) {
      return errorResponse("Invalid attendance ID", 400);
    }

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return errorResponse("Attendance record not found", 404);
    }

    const body = await request.json();
    const validatedData = updateAttendanceSchema.parse(body);

    const attendance = await prisma.$transaction(async (tx) => {
      const updatedAttendance = await tx.attendance.update({
        where: { id: attendanceId },
        data: {
          status: validatedData.status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "UPDATE_ATTENDANCE",
          entity: "Attendance",
          entityId: attendanceId.toString(),
          details: {
            employeeName: existingAttendance.user.name,
            employeeId: existingAttendance.user.id,
            date: existingAttendance.date.toISOString(),
            oldStatus: existingAttendance.status,
            newStatus: validatedData.status,
            updatedBy: admin.email,
          },
        },
      });

      return updatedAttendance;
    });

    return successResponse({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return errorResponse("Unauthorized", 401);
      }
      if (error.message.includes("Forbidden")) {
        return errorResponse("Forbidden - Admin access required", 403);
      }
    }

    console.error("Error updating attendance:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE /api/attendance/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const attendanceId = parseInt(id);

    if (isNaN(attendanceId)) {
      return errorResponse("Invalid attendance ID", 400);
    }

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return errorResponse("Attendance record not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendance.delete({
        where: { id: attendanceId },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "DELETE_ATTENDANCE",
          entity: "Attendance",
          entityId: attendanceId.toString(),
          details: {
            employeeName: existingAttendance.user.name,
            employeeId: existingAttendance.user.id,
            date: existingAttendance.date.toISOString(),
            status: existingAttendance.status,
            deletedBy: admin.email,
          },
        },
      });
    });

    return successResponse({
      message: "Attendance record deleted successfully",
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

    console.error("Error deleting attendance:", error);
    return errorResponse("Internal server error", 500);
  }
}

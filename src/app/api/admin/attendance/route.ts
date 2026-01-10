import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

// Validation schema for creating attendance
const createAttendanceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().transform((str) => new Date(str)),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

// POST /api/admin/attendance - Mark attendance
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAttendanceSchema.parse(body);

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: validatedData.userId,
        date: validatedData.date,
      },
    });

    if (existingAttendance) {
      return errorResponse(
        "Attendance already marked for this employee on this date. Use PUT to update.",
        409
      );
    }

    // Create attendance record with audit log
    const attendance = await prisma.$transaction(async (tx) => {
      // 1. Create attendance record
      const newAttendance = await tx.attendance.create({
        data: {
          userId: validatedData.userId,
          date: validatedData.date,
          status: validatedData.status,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // 2. Log the action
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "MARK_ATTENDANCE",
          entity: "Attendance",
          entityId: newAttendance.id.toString(),
          details: {
            employeeName: employee.name,
            employeeId: employee.id,
            date: validatedData.date.toISOString(),
            status: validatedData.status,
            markedBy: admin.email,
          },
        },
      });

      return newAttendance;
    });

    return successResponse(
      {
        message: "Attendance marked successfully",
        attendance,
      },
      201
    );
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

    console.error("Error marking attendance:", error);
    return errorResponse("Internal server error", 500);
  }
}

// GET /api/admin/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");

    // Build where clause
    const where: {
      userId?: string;
      status?: "PRESENT" | "ABSENT" | "LATE";
      date?: {
        equals?: Date;
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (userId) {
      where.userId = userId;
    }

    if (status && ["PRESENT", "ABSENT", "LATE"].includes(status)) {
      where.status = status as "PRESENT" | "ABSENT" | "LATE";
    }

    // Filter by specific date or date range
    if (date) {
      where.date = { equals: new Date(date) };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.attendance.count({ where });

    // Get attendance records with pagination
    const attendances = await prisma.attendance.findMany({
      where,
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
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate statistics if userId is provided
    let stats = null;
    if (userId) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAttendances = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          userId,
          date: { gte: thirtyDaysAgo },
        },
        _count: true,
      });

      stats = {
        last30Days: {
          present: recentAttendances.find((a) => a.status === "PRESENT")?._count || 0,
          absent: recentAttendances.find((a) => a.status === "ABSENT")?._count || 0,
          late: recentAttendances.find((a) => a.status === "LATE")?._count || 0,
        },
      };
    }

    return successResponse({
      attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      ...(stats && { stats }),
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

    console.error("Error fetching attendance:", error);
    return errorResponse("Internal server error", 500);
  }
}

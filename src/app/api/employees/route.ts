import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { generateId } from "better-auth";

// Validation schema for creating employee
const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
  role: z.enum(["ADMIN", "DELIVERY", "OWNER", "PHARMACIST", "CASHIER", "STOREKEEPER"]),
  status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]).default("ACTIVE"),
  dutyType: z.enum(["FULL_TIME", "PART_TIME"]),
  shift: z.enum(["DAY", "NIGHT"]),
  joiningDate: z.string().transform((str) => new Date(str)),
  monthlySalary: z.number().positive("Salary must be positive"),
  imageUrl: z.string().url().optional().nullable(),
});

// POST /api/admin/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (existingUser) return errorResponse("Email already exists", 409);

    const existingPhone = await prisma.user.findUnique({ where: { phone: validatedData.phone } });
    if (existingPhone) return errorResponse("Phone number already exists", 409);

    const employee = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: generateId(),
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          password: null,
          role: validatedData.role,
          status: validatedData.status,
          dutyType: validatedData.dutyType,
          shift: validatedData.shift,
          joiningDate: validatedData.joiningDate,
          monthlySalary: validatedData.monthlySalary,
          image: validatedData.imageUrl,
          emailVerified: true,
        },
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
        },
      });

      await tx.account.create({
        data: {
          id: generateId(),
          userId: newUser.id,
          accountId: newUser.email,
          providerId: "credential",
          password: null,
        },
      });

      await tx.payroll.create({
        data: {
          userId: newUser.id,
          baseSalary: validatedData.monthlySalary,
          allowances: 0,
          deductions: 0,
          netPay: validatedData.monthlySalary,
          paymentStatus: "PENDING",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "CREATE_EMPLOYEE",
          entity: "User",
          entityId: newUser.id,
          details: {
            employeeName: newUser.name,
            employeeEmail: newUser.email,
            role: newUser.role,
          },
        },
      });

      return newUser;
    });

    return successResponse({ message: "Employee created successfully", employee }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues.map((e) => e.message).join(", "), 400);
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Admin access required", 403);
    }

    console.error("Error creating employee:", error);
    return errorResponse("Internal server error", 500);
  }
}

// GET /api/admin/employees - Get all employees
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const duty = searchParams.get("duty");
    const shift = searchParams.get("shift");

    let where: any = { NOT: { status: "DELETED" } };

    const allowedRoles = ["ADMIN", "DELIVERY", "OWNER", "PHARMACIST", "CASHIER", "STOREKEEPER"];
    const allowedStatuses = ["ACTIVE", "ON_LEAVE", "INACTIVE"];
    const allowedDutyTypes = ["FULL_TIME", "PART_TIME"];
    const allowedShifts = ["DAY", "NIGHT"];

    if (role && allowedRoles.includes(role)) where.role = role;
    if (status && allowedStatuses.includes(status)) where.status = status;
    if (duty && allowedDutyTypes.includes(duty)) where.dutyType = duty;
    if (shift && allowedShifts.includes(shift)) where.shift = shift;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get stats for all filtered employees (not paginated)
    const [
      total,
      active,
      onLeave,
      inactive
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.user.count({ where: { ...where, status: "ON_LEAVE" } }),
      prisma.user.count({ where: { ...where, status: "INACTIVE" } })
    ]);

    const employees = await prisma.user.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        active,
        onLeave,
        inactive
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
      if (error.message.includes("Forbidden")) return errorResponse("Forbidden - Admin access required", 403);
    }

    console.error("Error fetching employees:", error);
    return errorResponse("Internal server error", 500);
  }
}

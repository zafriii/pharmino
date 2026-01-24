import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

// Validation schema for updating employee
const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  role: z.enum(["ADMIN", "DELIVERY", "OWNER", "PHARMACIST", "CASHIER", "STOREKEEPER"]).optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE", "DELETED"]).optional(),
  dutyType: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
  shift: z.enum(["DAY", "NIGHT"]).optional(),
  joiningDate: z.string().transform((v) => new Date(v)).optional(),
  monthlySalary: z.number().positive().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

/* GET Single Employee */
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
      },
    });

    if (!employee) return errorResponse("Employee not found", 404);

    return successResponse({ employee });
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

/* UPDATE Employee - /api/employees*/
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingEmployee = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingEmployee) return errorResponse("Employee not found", 404);

    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    // Email conflict
    if (validatedData.email && validatedData.email !== existingEmployee.email) {
      const exists = await prisma.user.findUnique({ where: { email: validatedData.email } });
      if (exists) return errorResponse("Email already exists", 409);
    }

    // Phone conflict
    if (validatedData.phone && validatedData.phone !== existingEmployee.phone) {
      const exists = await prisma.user.findUnique({ where: { phone: validatedData.phone } });
      if (exists) return errorResponse("Phone number already exists", 409);
    }

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.dutyType && { dutyType: validatedData.dutyType }),
        ...(validatedData.shift && { shift: validatedData.shift }),
        ...(validatedData.joiningDate && { joiningDate: validatedData.joiningDate }),
        ...(validatedData.monthlySalary && { monthlySalary: validatedData.monthlySalary }),
        ...(validatedData.imageUrl !== undefined && { image: validatedData.imageUrl }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_EMPLOYEE",
        entity: "User",
        entityId: id,
        details: {
          changes: validatedData,
          employeeName: updatedEmployee.name,
        },
      },
    });

    return successResponse({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues.map((e) => e.message).join(", "), 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

/*DELETE Employee (Soft) - /api/employees*/
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingEmployee = await prisma.user.findUnique({ where: { id } });
    if (!existingEmployee) return errorResponse("Employee not found", 404);

    if (existingEmployee.id === admin.id) {
      return errorResponse("Cannot delete your own account", 400);
    }

    const deletedEmployee = await prisma.user.update({
      where: { id },
      data: {
        status: "DELETED",
        email: `deleted_${Date.now()}_${existingEmployee.email}`,
        phone: `deleted_${Date.now()}_${existingEmployee.phone}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_EMPLOYEE",
        entity: "User",
        entityId: id,
        details: {
          employeeName: existingEmployee.name,
          employeeEmail: existingEmployee.email,
        },
      },
    });

    return successResponse({
      message: "Employee deleted successfully",
      employee: { id: deletedEmployee.id, name: deletedEmployee.name },
    });
  } catch (error) {
    return errorResponse("Internal server error", 500);
  }
}

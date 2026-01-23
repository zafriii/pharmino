import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/*Validation Schema */
const updatePayrollSchema = z.object({
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["PENDING", "PAID"]).optional(),
});

/*GET Single Payroll*/
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const payrollId = parseInt(id);
    if (isNaN(payrollId)) {
      return errorResponse("Invalid payroll ID", 400);
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            monthlySalary: true,
          },
        },
      },
    });

    if (!payroll) {
      return errorResponse("Payroll record not found", 404);
    }

    return successResponse({ payroll });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return errorResponse("Internal server error", 500);
  }
}

/*UPDATE Payroll*/
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const payrollId = parseInt(id);
    if (isNaN(payrollId)) {
      return errorResponse("Invalid payroll ID", 400);
    }

    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!existingPayroll) {
      return errorResponse("Payroll record not found", 404);
    }

    const body = await request.json();
    const validatedData = updatePayrollSchema.parse(body);

    const allowances =
      validatedData.allowances !== undefined
        ? new Decimal(validatedData.allowances)
        : existingPayroll.allowances;

    const deductions =
      validatedData.deductions !== undefined
        ? new Decimal(validatedData.deductions)
        : existingPayroll.deductions;

    const updateData: {
      allowances?: Decimal;
      deductions?: Decimal;
      netPay?: Decimal;
      paymentStatus?: "PENDING" | "PAID";
    } = {};

    if (
      validatedData.allowances !== undefined ||
      validatedData.deductions !== undefined
    ) {
      updateData.allowances = allowances;
      updateData.deductions = deductions;
      updateData.netPay = existingPayroll.baseSalary
        .plus(allowances)
        .minus(deductions);
    }

    if (validatedData.paymentStatus) {
      updateData.paymentStatus = validatedData.paymentStatus;
    }

    const payroll = await prisma.$transaction(async (tx) => {
      const updatedPayroll = await tx.payroll.update({
        where: { id: payrollId },
        data: updateData,
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
          action: "UPDATE_PAYROLL",
          entity: "Payroll",
          entityId: payrollId.toString(),
          details: {
            employeeName: existingPayroll.user.name,
            employeeId: existingPayroll.user.id,
            updatedBy: admin.email,
          },
        },
      });

      return updatedPayroll;
    });

    return successResponse({
      message: "Payroll updated successfully",
      payroll,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    console.error("Error updating payroll:", error);
    return errorResponse("Internal server error", 500);
  }
}

/*DELETE Payroll*/
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const payrollId = parseInt(id);
    if (isNaN(payrollId)) {
      return errorResponse("Invalid payroll ID", 400);
    }

    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!existingPayroll) {
      return errorResponse("Payroll record not found", 404);
    }

    if (existingPayroll.paymentStatus === "PAID") {
      return errorResponse(
        "Cannot delete paid payroll records",
        403
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.payroll.delete({ where: { id: payrollId } });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "DELETE_PAYROLL",
          entity: "Payroll",
          entityId: payrollId.toString(),
          details: {
            employeeName: existingPayroll.user.name,
            deletedBy: admin.email,
          },
        },
      });
    });

    return successResponse({
      message: "Payroll record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return errorResponse("Internal server error", 500);
  }
}

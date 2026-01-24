
import { requireAdmin, errorResponse, successResponse } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";

// Validation schema for setting password
const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// POST /api/employees/[id]/set-password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    const body = await request.json();
    const validatedData = setPasswordSchema.parse(body);

    const hashedPassword = await hashPassword(validatedData.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      const credentialAccount = employee.accounts[0];

      if (!credentialAccount) {
        throw new Error("Account record missing");
      }

      await tx.account.update({
        where: { id: credentialAccount.id },
        data: { password: hashedPassword },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "SET_EMPLOYEE_PASSWORD",
          entity: "User",
          entityId: id,
          details: {
            employeeName: employee.name,
            employeeEmail: employee.email,
            setBy: admin.email,
          },
        },
      });
    });

    return successResponse({
      message: "Password set successfully. Employee can now log in.",
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

    console.error("Error setting password:", error);
    return errorResponse("Internal server error", 500);
  }
}

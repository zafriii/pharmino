import { getServerSession } from "@/lib/get-session";
import { NextResponse } from "next/server";

/**
 * Require authentication - returns user or throws error
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Require admin role - returns admin user or throws error
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden - Admin access required");
  }

  return user;
}


/**
 * Require pharmacy roles (Owner, Pharmacist, Cashier, Storekeeper) or admin - returns user or throws error
 */
export async function requirePharmacyOrAdmin() {
  const user = await requireAuth();

  if (!["ADMIN", "OWNER", "PHARMACIST", "CASHIER", "STOREKEEPER"].includes(user.role)) {
    throw new Error("Forbidden - Pharmacy access required");
  }

  return user;
}

/**
 * Require pharmacist, owner or admin role - returns user or throws error
 */
export async function requirePharmacistOrOwnerOrAdmin() {
  const user = await requireAuth();

  if (!["ADMIN", "OWNER", "PHARMACIST"].includes(user.role)) {
    throw new Error("Forbidden - Pharmacist, Owner or Admin access required");
  }

  return user;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: { role: string }, allowedRoles: string[]) {
  return allowedRoles.includes(user.role);
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

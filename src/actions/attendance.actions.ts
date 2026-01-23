"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionToken } from "@/lib/cookie-utils";

// Schema validation
const attendanceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

const baseUrl = process.env.BETTER_AUTH_URL;

// MARK Attendance
export async function markAttendanceAction(
  userId: string,
  status: "PRESENT" | "ABSENT" | "LATE",
  date: string,
  attendanceId?: number
): Promise<ActionResponse> {
  try {
    const validatedData = attendanceSchema.parse({
      userId,
      date,
      status,
    });

    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // If attendanceId exists, update; otherwise create
    const url = attendanceId 
      ? `${baseUrl}/api/attendance/${attendanceId}`
      : `${baseUrl}/api/attendance`;
    
    const method = attendanceId ? "PUT" : "POST";
    const body = attendanceId 
      ? JSON.stringify({ status })
      : JSON.stringify(validatedData);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark attendance");
    }

    // Instant cache clear 
    // revalidateTag("attendance");
    revalidatePath("/admin/hr/attendance");

    return {
      success: true,
      message: `Attendance marked as ${status.toLowerCase()} successfully!`,
    };
  } catch (error: any) {
    console.error("Mark Attendance Error:", error);
    return {
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    };
  }
}

// UPDATE Attendance Status
export async function updateAttendanceAction(
  id: number,
  status: "PRESENT" | "ABSENT" | "LATE"
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/attendance/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update attendance");
    }

    // Instant cache clear
    // revalidateTag("attendance");
    revalidatePath("/admin/hr/attendance");

    return {
      success: true,
      message: "Attendance updated successfully!",
    };
  } catch (error: any) {
    console.error("Update Attendance Error:", error);
    return {
      success: false,
      message: "Failed to update attendance",
      error: error.message,
    };
  }
}

// DELETE Attendance Record
export async function deleteAttendanceAction(
  id: number
): Promise<ActionResponse> {
  try {
    // Cookie
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/attendance/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete attendance");
    }

    // Instant cache clear
    // revalidateTag("attendance");
    revalidatePath("/admin/hr/attendance");

    return {
      success: true,
      message: "Attendance record deleted successfully!",
    };
  } catch (error: any) {
    console.error("Delete Attendance Error:", error);
    return {
      success: false,
      message: "Failed to delete attendance",
      error: error.message,
    };
  }
}

// FETCH Employee Attendance Stats
export async function fetchEmployeeAttendanceStatsAction(
  userId: string
): Promise<{
  success: boolean;
  stats?: any;
  error?: string;
}> {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL;
    const sessionToken = await getSessionToken();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/attendance?userId=${userId}`,
      {
        headers: {
          Cookie: cookieHeader,
        },

        //  cache + revalidation
        next: {
          tags: [`attendance-stats-${userId}`],
          revalidate: 60, // cache for 60 seconds
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch attendance stats");
    }

    const data = await response.json();

    return {
      success: true,
      stats: data.stats, 
    };
  } catch (error: any) {
    console.error("Fetch Attendance Stats Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}




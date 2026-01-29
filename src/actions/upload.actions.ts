"use server";

import { UTApi } from "uploadthing/server";
import { requireAdmin } from "@/lib/auth-utils";

const utapi = new UTApi();

export async function deleteImageAction(url: string) {
  try {
    // Only admins should be able to delete files
    await requireAdmin();

    if (!url) return { success: false, message: "No URL provided" };

    // Identify if it's an UploadThing URL
    // Standard format: https://utfs.io/f/key or https://uploadthing.com/f/key
    const isUploadThingUrl = url.includes("utfs.io") || url.includes("uploadthing.com");
    if (!isUploadThingUrl) {
      return { success: false, message: "Not an UploadThing URL" };
    }

    // Extract file key from URL
    const fileKey = url.split("/").pop();
    if (!fileKey) return { success: false, message: "Could not extract file key" };

    const result = await utapi.deleteFiles(fileKey);
    return { success: result.success };
  } catch (error) {
    console.error("Delete image error:", error);
    return { success: false, message: "Failed to delete image" };
  }
}

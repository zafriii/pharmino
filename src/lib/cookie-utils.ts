import { cookies } from "next/headers";

/**
 * Get session token from cookies, handling both regular and secure cookie names
 * In production with HTTPS, browsers prefix secure cookies with "_Secure-"
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  
  // Try regular cookie name first
  let sessionToken = cookieStore.get("better-auth.session_token")?.value;
  
  // If not found, try secure cookie name (production HTTPS with double underscore)
  if (!sessionToken) {
    sessionToken = cookieStore.get("__Secure-better-auth.session_token")?.value;
  }
  
  return sessionToken;
}
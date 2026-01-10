import { toNextJsHandler } from "better-auth/next-js";

// Debug: Log environment variables
console.log('=== Environment Variables Check ===');
console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Import auth after logging
import { auth } from "@/lib/auth";
 
export const { POST, GET } = toNextJsHandler(auth);
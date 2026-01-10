// Load environment variables explicitly
import 'dotenv/config';

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '@/lib/prisma'

// Get environment variables with fallback
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || '';
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';



// Validate
if (BETTER_AUTH_SECRET.length < 32) {
  throw new Error(`BETTER_AUTH_SECRET must be at least 32 characters (currently ${BETTER_AUTH_SECRET.length})`);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  emailAndPassword:{
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
      }
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
    },
  },
});

export type Session = typeof auth.$Infer.Session;

export type User = typeof auth.$Infer.Session.user;
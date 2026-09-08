import { createNeonAuth } from "@neondatabase/auth/next/server";

/** Neon Auth is "on" only once NEON_AUTH_BASE_URL is set in the environment. */
export const authEnabled = !!process.env.NEON_AUTH_BASE_URL;

/**
 * Neon Auth server client. Null until the project is provisioned in the Neon
 * Console, which lets the whole app run locally in demo mode before then.
 */
export const auth = authEnabled
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    })
  : null;

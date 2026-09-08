import { NextResponse, type NextRequest } from "next/server";
import { createNeonAuth } from "@neondatabase/auth/next/server";

// Auth turns on only once the Neon Console has been provisioned.
const protect = process.env.NEON_AUTH_BASE_URL
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    }).middleware({ loginUrl: "/auth/sign-in" })
  : null;

export default function middleware(req: NextRequest) {
  if (!protect) return NextResponse.next(); // demo mode
  return protect(req);
}

export const config = {
  // everything except auth pages, the auth + shortcut APIs, and static assets
  matcher: ["/((?!auth|api|_next/static|_next/image|icons|favicon.ico|manifest.webmanifest).*)"],
};

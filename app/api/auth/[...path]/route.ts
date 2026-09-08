import { auth } from "@/lib/auth/server";

const missing = () =>
  Response.json({ error: "Neon Auth is not configured. Set NEON_AUTH_BASE_URL." }, { status: 503 });

const handler = auth?.handler();

export const GET = handler?.GET ?? missing;
export const POST = handler?.POST ?? missing;

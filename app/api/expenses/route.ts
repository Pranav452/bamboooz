import { NextRequest, NextResponse } from "next/server";
import { insertExpense, listExpenses } from "@/lib/db";
import { CATEGORY_KEYS } from "@/lib/categories";

function authed(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  return !!process.env.API_KEY && key === process.env.API_KEY;
}

// Used by the iPhone Shortcut. Body: {amount, category, remarks?, date?(YYYY-MM-DD)}
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ status: "error", message: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be > 0");
    if (!CATEGORY_KEYS.includes(b.category)) throw new Error(`category must be one of: ${CATEGORY_KEYS.join(", ")}`);
    const row = await insertExpense({ amount, category: b.category, remarks: b.remarks ?? "", spent_at: b.date || undefined });
    return NextResponse.json({ status: "ok", expense: row });
  } catch (e) {
    return NextResponse.json({ status: "error", message: (e as Error).message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ status: "error", message: "unauthorized" }, { status: 401 });
  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  return NextResponse.json({ status: "ok", month, expenses: await listExpenses(month) });
}

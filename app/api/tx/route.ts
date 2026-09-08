import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { DEMO_USER_ID, ensureProfile } from "@/lib/user";

/**
 * Endpoint for the iPhone Shortcut.
 * POST { amount, category, note?, merchant?, kind?, date? }  header: x-api-key
 */
function ownerFor(req: NextRequest): string | null {
  const key = req.headers.get("x-api-key");
  if (!process.env.API_KEY || key !== process.env.API_KEY) return null;
  return process.env.SHORTCUT_USER_ID || DEMO_USER_ID;
}

export async function POST(req: NextRequest) {
  const userId = ownerFor(req);
  if (!userId) return NextResponse.json({ status: "error", message: "unauthorized" }, { status: 401 });

  try {
    // the Shortcut can be the very first thing that ever touches this account
    await ensureProfile({ id: userId, email: null, name: "Me", image: null });
    const b = await req.json();
    const raw = Number(b.amount);
    if (!Number.isFinite(raw) || raw <= 0) throw new Error("amount must be greater than 0");

    const kind = b.kind === "income" ? "income" : "expense";
    const amount = kind === "income" ? raw : -raw;

    const cat = await sql`SELECT id, kind FROM categories WHERE user_id = ${userId} AND name = ${b.category}`;
    if (!cat[0]) {
      const names = await sql`SELECT name FROM categories WHERE user_id = ${userId} ORDER BY sort`;
      throw new Error(`unknown category. valid: ${names.map((n) => n.name).join(", ")}`);
    }

    let merchantId: number | null = null;
    if (b.merchant?.trim()) {
      const m = await sql`
        INSERT INTO merchants (user_id, name, visits) VALUES (${userId}, ${b.merchant.trim()}, 1)
        ON CONFLICT (user_id, name) DO UPDATE SET visits = merchants.visits + 1 RETURNING id`;
      merchantId = m[0].id as number;
    }

    const card = await sql`SELECT id FROM cards WHERE user_id = ${userId} AND is_default LIMIT 1`;

    const row = await sql`
      INSERT INTO transactions (user_id, amount, kind, category_id, merchant_id, card_id, note, occurred_at, source)
      VALUES (${userId}, ${amount}, ${kind}, ${cat[0].id}, ${merchantId}, ${card[0]?.id ?? null},
              ${b.note ?? ""}, COALESCE(${b.date || null}::timestamptz, now()), 'shortcut')
      RETURNING id::int AS id, amount::float8 AS amount, note, occurred_at`;

    return NextResponse.json({ status: "ok", transaction: row[0] });
  } catch (e) {
    return NextResponse.json({ status: "error", message: (e as Error).message }, { status: 400 });
  }
}

/** Category list, so the Shortcut can be built without guessing names. */
export async function GET(req: NextRequest) {
  const userId = ownerFor(req);
  if (!userId) return NextResponse.json({ status: "error", message: "unauthorized" }, { status: 401 });
  await ensureProfile({ id: userId, email: null, name: "Me", image: null });
  const cats = await sql`SELECT name, emoji, kind FROM categories WHERE user_id = ${userId} ORDER BY sort`;
  return NextResponse.json({ status: "ok", categories: cats });
}

"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/user";

/** Resolve a category name to an id for this user, creating nothing. */
async function categoryId(userId: string, name: string) {
  const r = await sql`SELECT id FROM categories WHERE user_id = ${userId} AND name = ${name}`;
  if (!r[0]) throw new Error(`Unknown category: ${name}`);
  return r[0].id as number;
}

async function merchantId(userId: string, name: string | null) {
  if (!name?.trim()) return null;
  const r = await sql`
    INSERT INTO merchants (user_id, name, visits) VALUES (${userId}, ${name.trim()}, 1)
    ON CONFLICT (user_id, name) DO UPDATE SET visits = merchants.visits + 1
    RETURNING id`;
  return r[0].id as number;
}

export async function addTransaction(formData: FormData) {
  const u = await requireUser();
  const raw = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "");
  const kind = String(formData.get("kind") ?? "expense");
  const note = String(formData.get("note") ?? "").trim();
  const merchant = String(formData.get("merchant") ?? "").trim() || null;
  const when = String(formData.get("occurred_at") ?? "");
  const cardId = Number(formData.get("card_id")) || null;

  if (!Number.isFinite(raw) || raw <= 0) throw new Error("Amount must be greater than zero");
  const amount = kind === "income" ? raw : -raw;

  await sql`
    INSERT INTO transactions (user_id, amount, kind, category_id, merchant_id, card_id, note, occurred_at, source)
    VALUES (${u.id}, ${amount}, ${kind}, ${await categoryId(u.id, category)},
            ${await merchantId(u.id, merchant)}, ${cardId}, ${note},
            COALESCE(${when || null}::timestamptz, now()), 'app')`;

  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteTransaction(id: number) {
  const u = await requireUser();
  await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${u.id}`;
  revalidatePath("/", "layout");
}

export async function toggleFreeze(cardId: number) {
  const u = await requireUser();
  await sql`UPDATE cards SET frozen = NOT frozen WHERE id = ${cardId} AND user_id = ${u.id}`;
  revalidatePath("/cards");
}

export async function setDefaultCard(cardId: number) {
  const u = await requireUser();
  await sql`UPDATE cards SET is_default = false WHERE user_id = ${u.id}`;
  await sql`UPDATE cards SET is_default = true WHERE id = ${cardId} AND user_id = ${u.id}`;
  revalidatePath("/cards");
}

export async function addCard(formData: FormData) {
  const u = await requireUser();
  const bank = String(formData.get("bank") ?? "").trim() || "New Card";
  const brand = String(formData.get("brand") ?? "VISA");
  const last4 = String(formData.get("last4") ?? "").trim();
  const balance = Number(formData.get("balance")) || 0;
  if (!/^\d{4}$/.test(last4)) throw new Error("Last 4 digits must be 4 numbers");
  const grads = [
    "linear-gradient(120deg,#5FB6EA,#2E8FD6)",
    "linear-gradient(120deg,#F27A66,#E8614F)",
    "linear-gradient(120deg,#8E7CF5,#5C46D6)",
    "linear-gradient(120deg,#34C77B,#149E58)",
  ];
  const n = await sql`SELECT count(*)::int AS c FROM cards WHERE user_id = ${u.id}`;
  await sql`INSERT INTO cards (user_id, bank, brand, last4, balance, gradient)
            VALUES (${u.id}, ${bank}, ${brand}, ${last4}, ${balance}, ${grads[(n[0].c as number) % 4]})`;
  revalidatePath("/cards");
}

export async function setBudget(formData: FormData) {
  const u = await requireUser();
  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Budget must be greater than zero");
  const cid = await categoryId(u.id, category);
  await sql`INSERT INTO budgets (user_id, category_id, amount, period)
            VALUES (${u.id}, ${cid}, ${amount}, 'month')
            ON CONFLICT (user_id, category_id, period) DO UPDATE SET amount = EXCLUDED.amount`;
  revalidatePath("/insights");
}

export async function deleteBudget(category: string) {
  const u = await requireUser();
  await sql`DELETE FROM budgets USING categories c
            WHERE budgets.category_id = c.id AND budgets.user_id = ${u.id} AND c.name = ${category}`;
  revalidatePath("/insights");
}

export async function markNotificationsRead() {
  const u = await requireUser();
  await sql`UPDATE notifications SET read = true WHERE user_id = ${u.id} AND NOT read`;
  revalidatePath("/", "layout");
}

export async function updateSetting(key: "face_id" | "push_enabled" | "hide_balance", value: boolean) {
  const u = await requireUser();
  const allowed = { face_id: "face_id", push_enabled: "push_enabled", hide_balance: "hide_balance" } as const;
  const col = allowed[key];
  if (!col) throw new Error("Bad setting");
  // column name is from a fixed allow-list above, never user input
  await sql.query(`UPDATE app_users SET ${col} = $1 WHERE id = $2`, [value, u.id]);
  revalidatePath("/", "layout");
}

export async function sendMoney(formData: FormData) {
  const u = await requireUser();
  const amount = Number(formData.get("amount"));
  const recipientId = Number(formData.get("recipient_id"));
  const fromCardId = Number(formData.get("from_card_id")) || null;
  const express = String(formData.get("express") ?? "") === "on";
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero");
  const fee = express ? 25 : 0;
  const reference = "TX-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const cat = await sql`SELECT id FROM categories WHERE user_id = ${u.id} AND name = 'Transfer'`;
  const r = await sql`SELECT name FROM recipients WHERE id = ${recipientId} AND user_id = ${u.id}`;

  await sql`INSERT INTO transfers (user_id, from_card_id, recipient_id, amount, fee, reference)
            VALUES (${u.id}, ${fromCardId}, ${recipientId}, ${amount}, ${fee}, ${reference})`;
  await sql`INSERT INTO transactions (user_id, amount, kind, category_id, card_id, note, source)
            VALUES (${u.id}, ${-(amount + fee)}, 'transfer', ${cat[0]?.id ?? null}, ${fromCardId},
                    ${"Transfer to " + (r[0]?.name ?? "recipient")}, 'app')`;

  revalidatePath("/", "layout");
  redirect(`/send/sent?ref=${reference}&amt=${amount}&to=${recipientId}`);
}

export async function addRecipient(formData: FormData) {
  const u = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  await sql`INSERT INTO recipients (user_id, name, bank, initials)
            VALUES (${u.id}, ${name}, ${bank}, ${initials})
            ON CONFLICT (user_id, name) DO UPDATE SET bank = EXCLUDED.bank`;
  revalidatePath("/send");
}

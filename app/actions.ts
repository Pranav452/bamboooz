"use server";
import { revalidatePath } from "next/cache";
import { insertExpense, deleteExpense } from "@/lib/db";
import { CATEGORY_KEYS } from "@/lib/categories";

export async function addExpense(formData: FormData) {
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "");
  const remarks = String(formData.get("remarks") ?? "").trim();
  const spent_at = String(formData.get("spent_at") ?? "") || undefined;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be > 0");
  if (!CATEGORY_KEYS.includes(category)) throw new Error("Bad category");
  await insertExpense({ amount, category, remarks, spent_at });
  revalidatePath("/");
}

export async function removeExpense(id: number) {
  await deleteExpense(id);
  revalidatePath("/");
}

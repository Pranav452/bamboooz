import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export type Expense = {
  id: number;
  amount: number;
  category: string;
  remarks: string;
  spent_at: string; // YYYY-MM-DD
};

export async function insertExpense(input: { amount: number; category: string; remarks?: string; spent_at?: string }) {
  const rows = await sql`
    INSERT INTO expenses (amount, category, remarks, spent_at)
    VALUES (${input.amount}, ${input.category}, ${input.remarks ?? ""}, COALESCE(${input.spent_at ?? null}::date, (now() AT TIME ZONE 'Asia/Kolkata')::date))
    RETURNING id::int AS id, amount::float8 AS amount, category, remarks, to_char(spent_at,'YYYY-MM-DD') AS spent_at`;
  return rows[0] as Expense;
}

export async function listExpenses(month: string) {
  // month = 'YYYY-MM'
  const rows = await sql`
    SELECT id::int AS id, amount::float8 AS amount, category, remarks, to_char(spent_at,'YYYY-MM-DD') AS spent_at
    FROM expenses
    WHERE to_char(spent_at,'YYYY-MM') = ${month}
    ORDER BY spent_at DESC, id DESC`;
  return rows as Expense[];
}

export async function deleteExpense(id: number) {
  await sql`DELETE FROM expenses WHERE id = ${id}`;
}

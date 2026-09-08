import { sql } from "@/lib/db";
import { monthRange } from "@/lib/money";

export type Tx = {
  id: number; amount: number; kind: string; note: string; tag: string | null;
  occurred_at: string; category: string | null; emoji: string | null; bg: string | null;
  merchant: string | null; merchant_sub: string | null; merchant_icon: string | null;
  merchant_bg: string | null; address: string | null; visits: number | null;
  card_last4: string | null; card_bank: string | null; has_receipt: boolean;
};

const TX_SELECT = `
  SELECT t.id::int AS id, t.amount::float8 AS amount, t.kind, t.note, t.tag,
         t.occurred_at, c.name AS category, c.emoji, c.bg,
         m.name AS merchant, m.sub AS merchant_sub, m.icon AS merchant_icon,
         m.icon_bg AS merchant_bg, m.address, m.visits,
         cd.last4 AS card_last4, cd.bank AS card_bank,
         EXISTS (SELECT 1 FROM receipts r WHERE r.transaction_id = t.id) AS has_receipt
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  LEFT JOIN merchants  m ON m.id = t.merchant_id
  LEFT JOIN cards     cd ON cd.id = t.card_id`;

export async function profile(userId: string) {
  const r = await sql`SELECT * FROM app_users WHERE id = ${userId}`;
  return r[0] as Record<string, unknown> | undefined;
}

export async function categories(userId: string) {
  return (await sql`SELECT id::int AS id, name, emoji, bg, kind, sort FROM categories
                    WHERE user_id = ${userId} AND NOT archived ORDER BY sort, name`) as {
    id: number; name: string; emoji: string; bg: string; kind: string; sort: number;
  }[];
}

export async function cards(userId: string) {
  return (await sql`SELECT id::int AS id, bank, brand, last4, exp, balance::float8 AS balance,
                           gradient, frozen, is_default
                    FROM cards WHERE user_id = ${userId} ORDER BY is_default DESC, id`) as {
    id: number; bank: string; brand: string; last4: string; exp: string | null;
    balance: number; gradient: string; frozen: boolean; is_default: boolean;
  }[];
}

/** Income, expenses and net for a month. */
export async function monthTotals(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const r = await sql`
    SELECT COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::float8 AS income,
           COALESCE(-SUM(amount) FILTER (WHERE amount < 0), 0)::float8 AS expenses
    FROM transactions
    WHERE user_id = ${userId} AND occurred_at >= ${start} AND occurred_at < ${end}`;
  const income = r[0].income as number, expenses = r[0].expenses as number;
  return { income, expenses, saved: income - expenses };
}

/** Running balance across every transaction ever, plus card balances. */
export async function totalBalance(userId: string) {
  const r = await sql`
    SELECT COALESCE(SUM(amount), 0)::float8 AS net FROM transactions WHERE user_id = ${userId}`;
  const c = await sql`SELECT COALESCE(SUM(balance),0)::float8 AS opening FROM cards WHERE user_id = ${userId}`;
  return (r[0].net as number) + (c[0].opening as number);
}

export async function spendByCategory(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return (await sql`
    SELECT c.name, c.emoji, c.bg, (-SUM(t.amount))::float8 AS total
    FROM transactions t JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId} AND t.amount < 0
      AND t.occurred_at >= ${start} AND t.occurred_at < ${end}
    GROUP BY c.name, c.emoji, c.bg ORDER BY total DESC`) as {
    name: string; emoji: string; bg: string; total: number;
  }[];
}

export async function recentTx(userId: string, limit = 20) {
  return (await sql.query(TX_SELECT + ` WHERE t.user_id = $1 ORDER BY t.occurred_at DESC, t.id DESC LIMIT $2`,
    [userId, limit])) as unknown as Tx[];
}

export async function txForMonth(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return (await sql.query(TX_SELECT + ` WHERE t.user_id = $1 AND t.occurred_at >= $2 AND t.occurred_at < $3
                                  ORDER BY t.occurred_at DESC, t.id DESC`,
    [userId, start, end])) as unknown as Tx[];
}

export async function txById(userId: string, id: number) {
  const r = (await sql.query(TX_SELECT + ` WHERE t.user_id = $1 AND t.id = $2`, [userId, id])) as unknown as Tx[];
  return r[0];
}

export async function searchTx(userId: string, q: string) {
  return (await sql.query(
    TX_SELECT + ` WHERE t.user_id = $1 AND (t.note ILIKE $2 OR c.name ILIKE $2 OR m.name ILIKE $2)
                  ORDER BY t.occurred_at DESC LIMIT 40`,
    [userId, `%${q}%`])) as unknown as Tx[];
}

export async function receiptFor(txId: number) {
  const r = await sql`SELECT id::int AS id, subtotal::float8 AS subtotal, tax::float8 AS tax,
                             total::float8 AS total, image_url
                      FROM receipts WHERE transaction_id = ${txId}`;
  if (!r[0]) return null;
  const items = await sql`SELECT name, price::float8 AS price, qty::float8 AS qty
                          FROM receipt_items WHERE receipt_id = ${r[0].id} ORDER BY sort, id`;
  return { ...(r[0] as Record<string, unknown>), items } as {
    id: number; subtotal: number; tax: number; total: number; image_url: string | null;
    items: { name: string; price: number; qty: number }[];
  };
}

export async function similarTx(userId: string, tx: Tx, limit = 4) {
  return (await sql.query(
    TX_SELECT + ` WHERE t.user_id = $1 AND t.id <> $2 AND (m.name = $3 OR c.name = $4)
                  ORDER BY t.occurred_at DESC LIMIT $5`,
    [userId, tx.id, tx.merchant, tx.category, limit])) as unknown as Tx[];
}

export async function budgetsVsActual(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return (await sql`
    SELECT c.name, c.emoji, b.amount::float8 AS budget,
           COALESCE((SELECT -SUM(t.amount) FROM transactions t
                     WHERE t.category_id = c.id AND t.amount < 0
                       AND t.occurred_at >= ${start} AND t.occurred_at < ${end}), 0)::float8 AS spent
    FROM budgets b JOIN categories c ON c.id = b.category_id
    WHERE b.user_id = ${userId} AND b.period = 'month'
    ORDER BY spent DESC`) as { name: string; emoji: string; budget: number; spent: number }[];
}

/** Daily expense totals for the trend chart. */
export async function dailyTrend(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return (await sql`
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           COALESCE(-SUM(t.amount), 0)::float8 AS total
    FROM generate_series(${start}::date, (${end}::date - 1), '1 day') AS d(day)
    LEFT JOIN transactions t ON t.user_id = ${userId} AND t.amount < 0
         AND (t.occurred_at AT TIME ZONE 'Asia/Kolkata')::date = d.day
    GROUP BY d.day ORDER BY d.day`) as { day: string; total: number }[];
}

/** Month-over-month expense totals for the last n months. */
export async function monthlySeries(userId: string, months = 6) {
  return (await sql`
    SELECT to_char(m.month, 'YYYY-MM') AS month,
           COALESCE(-SUM(t.amount), 0)::float8 AS total
    FROM generate_series(
           date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') - make_interval(months => ${months - 1}),
           date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata'), '1 month') AS m(month)
    LEFT JOIN transactions t ON t.user_id = ${userId} AND t.amount < 0
         AND date_trunc('month', t.occurred_at AT TIME ZONE 'Asia/Kolkata') = m.month
    GROUP BY m.month ORDER BY m.month`) as { month: string; total: number }[];
}

export async function subscriptions(userId: string) {
  return (await sql`SELECT id::int AS id, name, amount::float8 AS amount, cadence,
                           to_char(next_charge_on,'YYYY-MM-DD') AS next_charge_on, icon, color
                    FROM subscriptions WHERE user_id = ${userId} AND active ORDER BY next_charge_on NULLS LAST, id`) as {
    id: number; name: string; amount: number; cadence: string; next_charge_on: string | null;
    icon: string; color: string;
  }[];
}

export async function recipients(userId: string) {
  return (await sql`SELECT id::int AS id, name, bank, initials FROM recipients
                    WHERE user_id = ${userId} ORDER BY name`) as {
    id: number; name: string; bank: string | null; initials: string;
  }[];
}

export async function notifications(userId: string) {
  return (await sql`SELECT id::int AS id, emoji, title, body, link, read, created_at
                    FROM notifications WHERE user_id = ${userId}
                    ORDER BY created_at DESC LIMIT 50`) as {
    id: number; emoji: string; title: string; body: string; link: string | null;
    read: boolean; created_at: string;
  }[];
}

export async function unreadCount(userId: string) {
  const r = await sql`SELECT count(*)::int AS n FROM notifications WHERE user_id = ${userId} AND NOT read`;
  return r[0].n as number;
}

export async function transfers(userId: string, limit = 10) {
  return (await sql`SELECT t.id::int AS id, t.amount::float8 AS amount, t.fee::float8 AS fee,
                           t.reference, t.status, t.created_at, r.name AS recipient, r.bank, r.initials
                    FROM transfers t LEFT JOIN recipients r ON r.id = t.recipient_id
                    WHERE t.user_id = ${userId} ORDER BY t.created_at DESC LIMIT ${limit}`) as {
    id: number; amount: number; fee: number; reference: string; status: string;
    created_at: string; recipient: string | null; bank: string | null; initials: string | null;
  }[];
}

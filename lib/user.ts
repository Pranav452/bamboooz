import { auth, authEnabled } from "@/lib/auth/server";
import { sql } from "@/lib/db";

export const DEMO_USER_ID = "demo-user";

export type SessionUser = { id: string; email: string | null; name: string | null; image: string | null };

/** Current signed-in user, or the demo user when Neon Auth is not configured yet. */
export async function currentUser(): Promise<SessionUser | null> {
  if (!authEnabled || !auth) {
    return { id: DEMO_USER_ID, email: "demo@local", name: "Demo User", image: null };
  }
  const { data } = await auth.getSession();
  if (!data?.user) return null;
  const u = data.user;
  return { id: u.id, email: u.email ?? null, name: u.name ?? null, image: u.image ?? null };
}

/** Same, but throws — for server actions and routes that require a user. */
export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw new Error("Not signed in");
  await ensureProfile(u);
  return u;
}

/** Create the app_users row (and starter data) the first time we see a user. */
export async function ensureProfile(u: SessionUser) {
  const rows = await sql`
    INSERT INTO app_users (id, email, full_name, avatar_url)
    VALUES (${u.id}, ${u.email}, ${u.name}, ${u.image})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    RETURNING (xmax = 0) AS inserted`;
  if (rows[0]?.inserted) await seedUser(u.id);
}

/** Categories, a card and default budgets for a brand-new user. */
export async function seedUser(userId: string) {
  const cats: [string, string, string, string][] = [
    ["Snacks", "🍪", "#FFF1E3", "expense"],
    ["Cigarettes", "🚬", "#F1EFFC", "expense"],
    ["Breakfast", "🍳", "#FFF7DB", "expense"],
    ["Lunch", "🍛", "#FFF1E3", "expense"],
    ["Outing with friends", "🍻", "#E7F1FB", "expense"],
    ["Transportation", "🚕", "#FFF7DB", "expense"],
    ["Shopping", "🛍️", "#E7F1FB", "expense"],
    ["Date", "❤️", "#FCE8F0", "expense"],
    ["Rent", "🏠", "#E9F5EA", "expense"],
    ["Others", "📦", "#F2F2F4", "expense"],
    ["Income", "💵", "#E9F5EA", "income"],
    ["Transfer", "🔁", "#F2F2F4", "transfer"],
  ];
  for (let i = 0; i < cats.length; i++) {
    const [name, emoji, bg, kind] = cats[i];
    await sql`INSERT INTO categories (user_id, name, emoji, bg, kind, sort)
              VALUES (${userId}, ${name}, ${emoji}, ${bg}, ${kind}, ${i})
              ON CONFLICT (user_id, name) DO NOTHING`;
  }
  await sql`INSERT INTO cards (user_id, bank, brand, last4, exp, balance, gradient, is_default)
            VALUES (${userId}, 'Main Account', 'VISA', '8279', '03/29', 0,
                    'linear-gradient(120deg,#F27A66,#E8614F)', true)
            ON CONFLICT DO NOTHING`;
}

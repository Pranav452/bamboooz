import Link from "next/link";
import { requireUser } from "@/lib/user";
import { authEnabled } from "@/lib/auth/server";
import * as q from "@/lib/queries";
import TabBar from "../components/TabBar";
import Toggles from "../components/Toggles";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const u = await requireUser();
  const [p, cards] = await Promise.all([q.profile(u.id), q.cards(u.id)]);
  const name = (p?.full_name as string) ?? "User";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <h1 className="safe-top px-5 pb-3 text-2xl font-bold">Profile</h1>
      <main className="safe-bot space-y-4 px-5">
        <section className="card p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#111114] text-2xl font-semibold text-white">{initials}</div>
          <h2 className="mt-3 text-xl font-semibold">{name}</h2>
          <p className="text-sm text-[var(--muted)]">{(p?.email as string) ?? ""}</p>
          <span className="mt-2 inline-block rounded-full bg-[#FDF3D8] px-3 py-1 text-xs font-semibold text-[#8A6D1F]">{(p?.member_tier as string) ?? "Gold"} member</span>
        </section>

        <Toggles
          faceId={!!p?.face_id}
          push={!!p?.push_enabled}
          hideBalance={!!p?.hide_balance}
        />

        <section className="card divide-y divide-[var(--line)]">
          <Link href="/cards" className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span>Linked accounts</span><span className="text-[var(--muted)]">{cards.length} cards ›</span>
          </Link>
          <div className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span>Currency</span><span className="text-[var(--muted)]">{(p?.currency as string) ?? "INR"}</span>
          </div>
          <Link href="/transactions" className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span>All transactions</span><span className="text-[var(--muted)]">›</span>
          </Link>
        </section>

        {authEnabled ? (
          <form action="/api/auth/sign-out" method="post">
            <button className="w-full rounded-full border border-[var(--line)] py-3.5 text-sm font-semibold text-[#D92D20]">Sign out</button>
          </form>
        ) : (
          <p className="soft p-4 text-xs leading-relaxed text-[var(--muted)]">
            Running in demo mode. Set <strong>NEON_AUTH_BASE_URL</strong> to turn on Neon Auth and real sign-in.
          </p>
        )}
      </main>
      <TabBar />
    </>
  );
}

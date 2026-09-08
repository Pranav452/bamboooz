import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { SubBar } from "../components/Header";
import MarkRead from "../components/MarkRead";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Notifications() {
  const u = await requireUser();
  const items = await q.notifications(u.id);
  return (
    <>
      <SubBar title="Notifications" back="/" />
      <main className="safe-bot space-y-3 px-5">
        {items.some((n) => !n.read) && <MarkRead />}
        {items.length === 0 && <p className="soft p-6 text-center text-sm text-[var(--muted)]">Nothing here yet.</p>}
        <div className="card divide-y divide-[var(--line)]">
          {items.map((n) => {
            const body = (
              <div className={`flex gap-3 px-4 py-3.5 ${n.read ? "" : "bg-[#FAFAFB]"}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F2F2F4] text-lg">{n.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#F0362B]" />}
                  </span>
                  <span className="block text-xs leading-snug text-[var(--muted)]">{n.body}</span>
                  <span className="mt-0.5 block text-[11px] text-[#B4B4BA]">
                    {new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                  </span>
                </span>
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link}>{body}</Link> : <div key={n.id}>{body}</div>;
          })}
        </div>
      </main>
    </>
  );
}

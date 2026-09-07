import Link from "next/link";
import { listExpenses } from "@/lib/db";
import { emojiFor } from "@/lib/categories";
import AddForm from "./components/AddForm";
import DeleteButton from "./components/DeleteButton";

export const dynamic = "force-dynamic";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function istDate(d = new Date()) {
  return new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
}
function shiftMonth(m: string, by: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const today = istDate();
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const rows = await listExpenses(month);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const todayTotal = rows.filter((r) => r.spent_at === today).reduce((s, r) => s + r.amount, 0);
  const byCat = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => ((acc[r.category] = (acc[r.category] ?? 0) + r.amount), acc), {})
  ).sort((a, b) => b[1] - a[1]);
  const byDay = rows.reduce<Record<string, typeof rows>>((acc, r) => ((acc[r.spent_at] ??= []).push(r), acc), {});
  const monthLabel = new Date(month + "-01T00:00:00Z").toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <main className="mx-auto max-w-md p-4 space-y-4 pb-16">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spend</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/?m=${shiftMonth(month, -1)}`} className="rounded-lg bg-zinc-800 px-3 py-1">‹</Link>
          <span className="text-zinc-300">{monthLabel}</span>
          <Link href={`/?m=${shiftMonth(month, 1)}`} className="rounded-lg bg-zinc-800 px-3 py-1">›</Link>
        </div>
      </header>

      <AddForm today={today} />

      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-zinc-900 p-4">
          <div className="text-xs uppercase text-zinc-500">Today</div>
          <div className="text-2xl font-semibold">{inr(todayTotal)}</div>
        </div>
        <div className="rounded-2xl bg-zinc-900 p-4">
          <div className="text-xs uppercase text-zinc-500">This month</div>
          <div className="text-2xl font-semibold">{inr(total)}</div>
        </div>
      </section>

      {byCat.length > 0 && (
        <section className="rounded-2xl bg-zinc-900 p-4 space-y-2">
          <div className="text-xs uppercase text-zinc-500">By category</div>
          {byCat.map(([c, v]) => (
            <div key={c} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{emojiFor(c)} {c}</span>
                <span className="text-zinc-300">{inr(v)} <span className="text-zinc-600">{Math.round((v / total) * 100)}%</span></span>
              </div>
              <div className="h-1.5 rounded bg-zinc-800"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${(v / total) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        {rows.length === 0 && <p className="text-center text-zinc-600 py-8">Nothing logged in {monthLabel}.</p>}
        {Object.entries(byDay).map(([day, items]) => (
          <div key={day} className="rounded-2xl bg-zinc-900">
            <div className="flex justify-between px-4 pt-3 pb-1 text-xs uppercase text-zinc-500">
              <span>{day === today ? "Today" : new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
              <span>{inr(items.reduce((s, r) => s + r.amount, 0))}</span>
            </div>
            {items.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2 border-t border-zinc-800/60">
                <span className="text-xl">{emojiFor(r.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{r.category}</div>
                  {r.remarks && <div className="truncate text-xs text-zinc-500">{r.remarks}</div>}
                </div>
                <div className="font-medium">{inr(r.amount)}</div>
                <DeleteButton id={r.id} />
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

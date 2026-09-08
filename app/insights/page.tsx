import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { plain, todayIST, shiftMonth, monthLabel } from "@/lib/money";
import TabBar from "../components/TabBar";
import Chart from "../components/Chart";
import Link from "next/link";
import BudgetEditor from "../components/BudgetEditor";

export const dynamic = "force-dynamic";

export default async function Insights({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const u = await requireUser();
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : todayIST().slice(0, 7);

  const [p, totals, cats, budgets, daily, prev] = await Promise.all([
    q.profile(u.id), q.monthTotals(u.id, month), q.spendByCategory(u.id, month),
    q.budgetsVsActual(u.id, month), q.dailyTrend(u.id, month),
    q.monthTotals(u.id, shiftMonth(month, -1)),
  ]);
  const currency = (p?.currency as string) ?? "INR";
  const allCats = await q.categories(u.id);

  const days = daily.length || 1;
  const avg = totals.expenses / days;
  const delta = prev.expenses ? Math.round(((totals.expenses - prev.expenses) / prev.expenses) * 100) : 0;
  const top = cats[0];
  const topPct = top && totals.expenses ? Math.round((top.total / totals.expenses) * 100) : 0;

  // weekly buckets for the trend line
  const weeks = [0, 0, 0, 0, 0];
  daily.forEach((d, i) => { weeks[Math.min(4, Math.floor(i / 7))] += d.total; });
  const wLabels = weeks.map((_, i) => `W ${i + 1}`).slice(0, Math.ceil(days / 7));
  const wPoints = weeks.slice(0, Math.max(2, wLabels.length));

  const Stat = ({ label, value, note, good }: { label: string; value: string; note?: string; good?: boolean }) => (
    <div className="card p-4">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 text-2xl font-bold">{value}</div>
      {note && <div className={`mt-1 text-xs font-medium ${good ? "text-[#22A64A]" : "text-[#F0362B]"}`}>{note}</div>}
    </div>
  );

  return (
    <>
      <header className="safe-top flex items-center justify-between px-5 pb-4">
        <h1 className="text-2xl font-bold">Spending Insight</h1>
        <div className="flex items-center gap-1 text-sm">
          <Link href={`/insights?m=${shiftMonth(month, -1)}`} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)]">‹</Link>
          <span className="px-1 text-[13px] text-[var(--muted)]">{monthLabel(month)}</span>
          <Link href={`/insights?m=${shiftMonth(month, 1)}`} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)]">›</Link>
        </div>
      </header>

      <main className="safe-bot space-y-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total Spent" value={plain(totals.expenses, currency)}
            note={prev.expenses ? `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs last month` : undefined}
            good={delta <= 0} />
          <Stat label="Daily Average" value={plain(avg, currency)} note={`over ${days} days`} good />
          <Stat label="Biggest Category" value={top?.name ?? "—"} note={top ? `${topPct}% of total` : undefined} good />
          <Stat label="Saved" value={plain(totals.saved, currency)} note={totals.saved >= 0 ? "in the black" : "overspent"} good={totals.saved >= 0} />
        </div>

        <section className="card p-4">
          <h2 className="mb-2 text-[15px] font-semibold">Spending Trend</h2>
          {totals.expenses === 0
            ? <p className="py-8 text-center text-sm text-[var(--muted)]">Nothing to chart yet.</p>
            : <Chart points={wPoints} labels={wLabels} />}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-[15px] font-semibold">By Category</h2>
          {cats.length === 0 ? <p className="text-sm text-[var(--muted)]">No spending this month.</p> : (
            <div className="space-y-3">
              {cats.map((c) => {
                const pct = Math.round((c.total / totals.expenses) * 100);
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm">
                      <span>{c.emoji} {c.name}</span>
                      <span className="font-medium">{plain(c.total, currency)} <span className="text-[var(--muted)]">{pct}%</span></span>
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-[#F2F2F4]">
                      <div className="h-1.5 rounded bg-[#111114]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Budget vs Actual</h2>
          <div className="space-y-3">
            {budgets.map((b) => {
              const over = b.spent > b.budget;
              const pct = Math.min(100, (b.spent / b.budget) * 100);
              return (
                <div key={b.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{b.emoji} {b.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{plain(b.spent, currency)} / {plain(b.budget, currency)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${over ? "bg-[#FDE8E6] text-[#D92D20]" : "bg-[#E5F7EA] text-[#1A8F42]"}`}>{over ? "Over" : "Under"}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-[#F2F2F4]">
                    <div className="h-1.5 rounded" style={{ width: `${pct}%`, background: over ? "#E8611A" : "#22C55E" }} />
                  </div>
                </div>
              );
            })}
            {budgets.length === 0 && <p className="text-sm text-[var(--muted)]">No budgets set.</p>}
          </div>
          <BudgetEditor categories={allCats.filter((c) => c.kind === "expense")} existing={budgets.map((b) => b.name)} />
        </section>
      </main>
      <TabBar />
    </>
  );
}

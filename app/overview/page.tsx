import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { plain, todayIST, monthLabel } from "@/lib/money";
import { SubBar } from "../components/Header";
import Chart from "../components/Chart";
import { TxList } from "../components/TxRow";

export const dynamic = "force-dynamic";

const BAR_COLORS = ["#22C55E", "#F5B301", "#0A7AFF", "#F0362B", "#8E7CF5", "#E8611A"];

export default async function Overview() {
  const u = await requireUser();
  const month = todayIST().slice(0, 7);
  const [p, series, totals, cats, txs] = await Promise.all([
    q.profile(u.id), q.monthlySeries(u.id, 6), q.monthTotals(u.id, month),
    q.spendByCategory(u.id, month), q.recentTx(u.id, 5),
  ]);
  const currency = (p?.currency as string) ?? "INR";

  const past = series.slice(0, -1);
  const avg = past.length ? past.reduce((s, x) => s + x.total, 0) / past.length : 0;
  const delta = avg ? Math.round(((totals.expenses - avg) / avg) * 100) : 0;
  const totalCat = cats.reduce((s, c) => s + c.total, 0) || 1;

  return (
    <>
      <SubBar title="Overview" back="/" />
      <main className="safe-bot space-y-4 px-5">
        <section className="card p-5 text-center">
          <div className="text-sm text-[var(--muted)]">Expense · {monthLabel(month)}</div>
          <div className="mt-1 text-4xl font-bold">-{plain(totals.expenses, currency)}</div>
          {avg > 0 && (
            <p className="mt-1 text-xs">
              <span className={delta <= 0 ? "font-semibold text-[#22A64A]" : "font-semibold text-[#F0362B]"}>
                {Math.abs(delta)}%
              </span>{" "}
              <span className="text-[var(--muted)]">{delta <= 0 ? "less" : "more"} than your average monthly spending</span>
            </p>
          )}
          <div className="mt-3">
            <Chart
              points={series.map((s) => s.total)}
              labels={series.map((s) => new Date(s.month + "-01T00:00:00Z").toLocaleString("en-IN", { month: "short", timeZone: "UTC" }))}
            />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Spendings</h2>
          {cats.length === 0 ? <p className="text-sm text-[var(--muted)]">No spending this month.</p> : (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-full">
                {cats.map((c, i) => (
                  <span key={c.name} style={{ width: `${(c.total / totalCat) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {cats.slice(0, 6).map((c, i) => (
                  <span key={c.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                    {c.name}
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-2xl bg-[#F7F7F9] p-3 text-center text-sm">
                You spent <strong>{plain(totals.expenses, currency)}</strong> this month
              </p>
            </>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-semibold">Recent Transactions</h2>
          {txs.length === 0
            ? <p className="soft p-6 text-center text-sm text-[var(--muted)]">Nothing yet.</p>
            : <TxList items={txs} currency={currency} />}
        </section>
      </main>
    </>
  );
}

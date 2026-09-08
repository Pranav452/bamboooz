import Link from "next/link";
import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { plain, money, todayIST } from "@/lib/money";
import { TopBar } from "./components/Header";
import TabBar from "./components/TabBar";
import { TxList } from "./components/TxRow";
import BalanceCard from "./components/BalanceCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const u = await requireUser();
  const month = todayIST().slice(0, 7);
  const [p, totals, balance, cats, txs, unread, subs, budgets] = await Promise.all([
    q.profile(u.id), q.monthTotals(u.id, month), q.totalBalance(u.id),
    q.spendByCategory(u.id, month), q.recentTx(u.id, 6), q.unreadCount(u.id),
    q.subscriptions(u.id), q.budgetsVsActual(u.id, month),
  ]);
  const currency = (p?.currency as string) ?? "INR";
  const over = budgets.find((b) => b.spent > b.budget);
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });

  return (
    <>
      <TopBar name={(p?.full_name as string) ?? "there"} unread={unread} dateLabel={dateLabel} />
      <main className="safe-bot space-y-4 px-5">
        <BalanceCard
          balance={balance}
          hidden={!!p?.hide_balance}
          income={totals.income}
          expenses={totals.expenses}
          saved={totals.saved}
          currency={currency}
        />

        {over && (
          <Link href="/insights" className="soft flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#111114] text-white">✦</span>
            <span className="flex-1 text-[13px] leading-snug">
              You are over your {over.name} budget by{" "}
              <strong>{plain(over.spent - over.budget, currency)}</strong> this month.
            </span>
            <span className="text-[var(--muted)]">›</span>
          </Link>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Spending by Category</h2>
            <Link href="/insights" className="text-[13px] text-[#0A7AFF]">See all</Link>
          </div>
          {cats.length === 0 ? (
            <p className="soft p-4 text-sm text-[var(--muted)]">No spending logged this month yet.</p>
          ) : (
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
              {cats.map((c) => (
                <div key={c.name} className="card w-28 shrink-0 p-3 text-center">
                  <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full text-2xl" style={{ background: c.bg }}>{c.emoji}</div>
                  <div className="truncate text-xs text-[var(--muted)]">{c.name}</div>
                  <div className="text-[15px] font-semibold">{plain(c.total, currency)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link href="/insights" className="card p-4">
            <div className="mb-1 flex items-center justify-between text-[15px] font-semibold">Spendings <span className="text-[var(--muted)]">›</span></div>
            <p className="text-xs text-[var(--muted)]">You spent <strong className="text-[var(--ink)]">{plain(totals.expenses, currency)}</strong> this month</p>
          </Link>
          <div className="card p-4">
            <div className="mb-1 text-[15px] font-semibold">Subscriptions</div>
            {subs.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">None tracked</p>
            ) : (
              <div className="flex -space-x-2">
                {subs.slice(0, 4).map((s) => (
                  <span key={s.id} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white text-sm" style={{ background: s.color, color: "#fff" }}>{s.icon}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-[13px] text-[#0A7AFF]">See all</Link>
          </div>
          {txs.length === 0 ? (
            <div className="soft p-6 text-center">
              <p className="text-sm text-[var(--muted)]">No transactions yet.</p>
              <Link href="/add" className="mt-3 inline-block rounded-full bg-[#111114] px-5 py-2.5 text-sm font-semibold text-white">Add your first</Link>
            </div>
          ) : (
            <TxList items={txs} currency={currency} />
          )}
        </section>
      </main>
      <TabBar />
    </>
  );
}

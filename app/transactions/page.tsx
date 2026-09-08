import Link from "next/link";
import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { todayIST, shiftMonth, monthLabel, plain } from "@/lib/money";
import { SubBar } from "../components/Header";
import { TxList } from "../components/TxRow";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "expense", label: "Expenses" },
  { key: "income", label: "Income" },
  { key: "transfer", label: "Transfers" },
];

export default async function Transactions({
  searchParams,
}: { searchParams: Promise<{ m?: string; f?: string }> }) {
  const u = await requireUser();
  const { m, f } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : todayIST().slice(0, 7);
  const filter = f ?? "all";

  const [p, all] = await Promise.all([q.profile(u.id), q.txForMonth(u.id, month)]);
  const currency = (p?.currency as string) ?? "INR";
  const items = filter === "all" ? all : all.filter((t) => t.kind === filter);
  const total = items.reduce((s, t) => s + (t.amount < 0 ? -t.amount : 0), 0);

  return (
    <>
      <SubBar title="Transactions" back="/" />
      <main className="safe-bot space-y-4 px-5">
        <div className="flex items-center justify-between">
          <Link href={`/transactions?m=${shiftMonth(month, -1)}&f=${filter}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)]">‹</Link>
          <div className="text-center">
            <div className="text-sm font-semibold">{monthLabel(month)}</div>
            <div className="text-xs text-[var(--muted)]">{items.length} items · {plain(total, currency)} spent</div>
          </div>
          <Link href={`/transactions?m=${shiftMonth(month, 1)}&f=${filter}`} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)]">›</Link>
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((x) => (
            <Link key={x.key} href={`/transactions?m=${month}&f=${x.key}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === x.key ? "border-[#111114] bg-[#111114] text-white" : "border-[var(--line)]"}`}>
              {x.label}
            </Link>
          ))}
        </div>

        {items.length === 0
          ? <p className="soft p-6 text-center text-sm text-[var(--muted)]">Nothing here for {monthLabel(month)}.</p>
          : <TxList items={items} currency={currency} />}
      </main>
    </>
  );
}

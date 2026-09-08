import Link from "next/link";
import type { Tx } from "@/lib/queries";
import { money } from "@/lib/money";

export function whenLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const day = new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  if (day === today) return `Today, ${time}`;
  const yest = new Date(Date.now() + 5.5 * 3600e3 - 864e5).toISOString().slice(0, 10);
  if (day === yest) return `Yesterday, ${time}`;
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function groupLabel(iso: string) {
  const w = whenLabel(iso);
  if (w.startsWith("Today")) return "Today";
  if (w.startsWith("Yesterday")) return "Yesterday";
  return "Earlier";
}

export default function TxRow({ tx, currency }: { tx: Tx; currency: string }) {
  const icon = tx.merchant_icon ?? tx.emoji ?? "📦";
  const bg = tx.merchant_bg ?? tx.bg ?? "#F2F2F4";
  const title = tx.merchant || tx.note || tx.category || "Transaction";
  const sub = tx.merchant ? (tx.category ?? "") : tx.note ? (tx.category ?? "") : (tx.card_bank ?? "");
  return (
    <Link href={`/tx/${tx.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-[#FAFAFB]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl" style={{ background: bg }}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <span className="truncate">{sub}</span>
          {tx.tag && <span className="rounded-full bg-[#E3F0FF] px-1.5 py-0.5 text-[10px] font-medium text-[#0A7AFF]">{tx.tag}</span>}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[15px] font-semibold ${tx.amount > 0 ? "text-[#22A64A]" : ""}`}>
          {money(tx.amount, currency)}
        </span>
        <span className="block text-[11px] text-[var(--muted)]">{whenLabel(tx.occurred_at)}</span>
      </span>
    </Link>
  );
}

export function TxList({ items, currency }: { items: Tx[]; currency: string }) {
  let last: string | null = null;
  return (
    <div className="card overflow-hidden">
      {items.map((t) => {
        const g = groupLabel(t.occurred_at);
        const show = g !== last;
        last = g;
        return (
          <div key={t.id}>
            {show && <div className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{g}</div>}
            <TxRow tx={t} currency={currency} />
          </div>
        );
      })}
    </div>
  );
}

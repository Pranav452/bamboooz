import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { money, plain } from "@/lib/money";
import { SubBar } from "../../components/Header";
import TxRow, { whenLabel } from "../../components/TxRow";
import DeleteTx from "../../components/DeleteTx";

export const dynamic = "force-dynamic";

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const tx = await q.txById(u.id, Number(id));
  if (!tx) notFound();

  const [p, receipt, similar] = await Promise.all([
    q.profile(u.id), q.receiptFor(tx.id), q.similarTx(u.id, tx),
  ]);
  const currency = (p?.currency as string) ?? "INR";
  const title = tx.merchant || tx.note || tx.category || "Transaction";

  return (
    <>
      <SubBar title="Transaction" back="/transactions" />
      <main className="safe-bot space-y-4 px-5">
        <section className="card p-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full text-3xl"
            style={{ background: tx.merchant_bg ?? tx.bg ?? "#F2F2F4" }}>
            {tx.merchant_icon ?? tx.emoji ?? "📦"}
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className={`mt-1 text-4xl font-bold ${tx.amount > 0 ? "text-[#22A64A]" : ""}`}>{money(tx.amount, currency)}</div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {whenLabel(tx.occurred_at)}
            {tx.card_last4 && ` · ${tx.card_bank} •••• ${tx.card_last4}`}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {tx.category && <span className="rounded-full bg-[#F2F2F4] px-3 py-1 text-xs">{tx.category}</span>}
            {tx.tag && <span className="rounded-full bg-[#E3F0FF] px-3 py-1 text-xs text-[#0A7AFF]">✦ {tx.tag}</span>}
            <span className="rounded-full bg-[#F2F2F4] px-3 py-1 text-xs capitalize">{tx.kind}</span>
          </div>
          {tx.note && <p className="mt-3 text-sm text-[var(--muted)]">{tx.note}</p>}
        </section>

        <section>
          <h3 className="mb-2 text-[15px] font-semibold">Receipt</h3>
          {receipt ? (
            <div className="card p-4">
              {receipt.items.map((it, i) => (
                <div key={i} className="flex justify-between border-b border-[var(--line)] py-2 text-sm last:border-0">
                  <span>{it.name}{it.qty > 1 ? ` ×${it.qty}` : ""}</span>
                  <span className="font-medium">{plain(it.price, currency)}</span>
                </div>
              ))}
              <div className="mt-2 space-y-1 border-t border-[var(--line)] pt-2 text-sm">
                {receipt.tax != null && <div className="flex justify-between text-[var(--muted)]"><span>Tax</span><span>{plain(receipt.tax, currency)}</span></div>}
                <div className="flex justify-between font-semibold"><span>Total</span><span>{plain(receipt.total ?? Math.abs(tx.amount), currency)}</span></div>
              </div>
            </div>
          ) : (
            <div className="soft p-6 text-center text-sm text-[var(--muted)]">No receipt attached yet.</div>
          )}
        </section>

        {tx.merchant && (
          <section>
            <h3 className="mb-2 text-[15px] font-semibold">Merchant Info</h3>
            <div className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full text-xl" style={{ background: tx.merchant_bg ?? "#F2F2F4" }}>{tx.merchant_icon ?? tx.emoji ?? "🏪"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{tx.merchant}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{tx.merchant_sub ?? tx.category}{tx.address ? ` · ${tx.address}` : ""}</span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-semibold">{tx.visits ?? 1}</span>
                <span className="block text-[10px] text-[var(--muted)]">{tx.visits === 1 ? "visit" : "visits"}</span>
              </span>
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h3 className="mb-2 text-[15px] font-semibold">Similar Transactions</h3>
            <div className="card overflow-hidden">
              {similar.map((s) => <TxRow key={s.id} tx={s} currency={currency} />)}
            </div>
          </section>
        )}

        <DeleteTx id={tx.id} />
      </main>
    </>
  );
}

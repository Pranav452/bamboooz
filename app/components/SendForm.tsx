"use client";
import { useState, useTransition } from "react";
import { sendMoney, addRecipient } from "@/app/actions";
import { plain } from "@/lib/money";

type Card = { id: number; bank: string; brand: string; last4: string; balance: number };
type Person = { id: number; name: string; bank: string | null; initials: string };

const QUICK = [100, 500, 1000, 2000];
const EXPRESS_FEE = 25;

export default function SendForm({
  cards, recipients, currency, recent,
}: {
  cards: Card[]; recipients: Person[]; currency: string;
  recent: { id: number; amount: number; recipient: string | null; reference: string }[];
}) {
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState(cards[0]?.id ?? 0);
  const [who, setWho] = useState(recipients[0]?.id ?? 0);
  const [express, setExpress] = useState(false);
  const [adding, setAdding] = useState(recipients.length === 0);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const value = Number(amount) || 0;
  const fee = express ? EXPRESS_FEE : 0;
  const card = cards.find((c) => c.id === cardId);
  const sym = currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">Sending From</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Add a card first.</p>
        ) : (
          <select value={cardId} onChange={(e) => setCardId(Number(e.target.value))}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm">
            {cards.map((c) => (
              <option key={c.id} value={c.id}>{c.bank} · {c.brand} •••• {c.last4} — {plain(c.balance, currency)}</option>
            ))}
          </select>
        )}
      </section>

      <section className="card p-5 text-center">
        <h2 className="text-sm font-semibold">Amount to Send</h2>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="text-3xl text-[var(--muted)]">{sym}</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal"
            placeholder="0" className="w-40 bg-transparent text-center text-4xl font-bold outline-none placeholder:text-[#D2D2D8]" />
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {QUICK.map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs">{sym}{v}</button>
          ))}
        </div>
        <label className="mt-4 flex items-center justify-between rounded-xl bg-[#F7F7F9] px-3 py-2.5 text-left text-xs">
          <span>Express transfer <span className="text-[var(--muted)]">(+{plain(EXPRESS_FEE, currency)} fee)</span></span>
          <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} className="h-4 w-4" />
        </label>
        <p className="mt-2 text-xs text-[var(--muted)]">Fee {plain(fee, currency)} · Total {plain(value + fee, currency)}</p>
        {card && value + fee > card.balance && (
          <p className="mt-1 text-xs font-medium text-[#D92D20]">More than this card&apos;s balance.</p>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Sending To</h2>
          <button onClick={() => setAdding(!adding)} className="text-xs text-[#0A7AFF]">{adding ? "Cancel" : "New"}</button>
        </div>

        {adding ? (
          <form action={(fd) => start(async () => { await addRecipient(fd); setAdding(false); })} className="space-y-2">
            <input name="name" placeholder="Recipient name" required className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
            <input name="bank" placeholder="Bank / UPI (optional)" className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
            <button disabled={pending} className="w-full rounded-full bg-[#111114] py-2.5 text-sm font-semibold text-white disabled:opacity-40">
              {pending ? "Adding…" : "Add recipient"}
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            {recipients.map((r) => (
              <button key={r.id} onClick={() => setWho(r.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${who === r.id ? "border-[#111114]" : "border-[var(--line)]"}`}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F1FB] text-sm font-semibold text-[#0A7AFF]">{r.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{r.bank ?? "—"}</span>
                </span>
                {who === r.id && <span className="text-[#111114]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {err && <p className="rounded-2xl bg-[#FDE8E6] p-3 text-sm text-[#D92D20]">{err}</p>}

      <button
        disabled={pending || value <= 0 || !who || !cardId}
        onClick={() => {
          setErr("");
          const fd = new FormData();
          fd.set("amount", String(value));
          fd.set("recipient_id", String(who));
          fd.set("from_card_id", String(cardId));
          if (express) fd.set("express", "on");
          start(async () => {
            try { await sendMoney(fd); }
            catch (e) { const m = (e as Error).message; if (!m.includes("NEXT_REDIRECT")) setErr(m); }
          });
        }}
        className="w-full rounded-full bg-[#111114] py-4 text-[17px] font-semibold text-white disabled:opacity-30">
        {pending ? "Sending…" : "Review & Send"}
      </button>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Recent transfers</h2>
          <div className="card divide-y divide-[var(--line)]">
            {recent.map((t) => (
              <div key={t.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{t.recipient ?? "—"}</span>
                <span className="text-right">
                  <span className="block font-medium">{plain(t.amount, currency)}</span>
                  <span className="block text-[11px] text-[var(--muted)]">{t.reference}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

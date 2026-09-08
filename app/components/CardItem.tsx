"use client";
import { useState, useTransition } from "react";
import { toggleFreeze, setDefaultCard, addCard } from "@/app/actions";

type Card = {
  id: number; bank: string; brand: string; last4: string; exp: string | null;
  balance: number; gradient: string; frozen: boolean; is_default: boolean;
};

export default function CardItem({ card, label }: { card: Card; label: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-3xl p-5 text-white"
        style={{ background: card.gradient, filter: card.frozen ? "grayscale(0.7)" : undefined }}>
        <div className="flex items-start justify-between">
          <span className="text-sm opacity-90">{card.bank}</span>
          <span className="text-lg font-bold italic">{card.brand}</span>
        </div>
        <div className="mt-8 text-lg tracking-[0.2em]">•••• •••• •••• {card.last4}</div>
        <div className="mt-3 flex items-end justify-between text-xs opacity-90">
          <span>{card.exp ?? ""}</span>
          <span className="text-right">
            <span className="block opacity-80">Balance</span>
            <span className="text-base font-semibold">{label}</span>
          </span>
        </div>
        {card.frozen && <span className="absolute left-5 top-1/2 rounded-full bg-black/40 px-3 py-1 text-xs">❄ Frozen</span>}
      </div>
      <div className="flex gap-2">
        <button disabled={pending} onClick={() => start(() => toggleFreeze(card.id))}
          className="flex-1 rounded-full border border-[var(--line)] py-2.5 text-sm font-medium disabled:opacity-50">
          {card.frozen ? "Unfreeze" : "Freeze"}
        </button>
        <button disabled={pending || card.is_default} onClick={() => start(() => setDefaultCard(card.id))}
          className={`flex-1 rounded-full py-2.5 text-sm font-medium ${card.is_default ? "bg-[#111114] text-white" : "border border-[var(--line)]"}`}>
          {card.is_default ? "Default" : "Set default"}
        </button>
      </div>
    </div>
  );
}

export function AddCardForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full rounded-full border border-dashed border-[#C9C9D0] py-3.5 text-sm font-medium text-[var(--muted)]">
      + Add new card
    </button>
  );

  return (
    <form
      action={(fd) => start(async () => {
        setErr("");
        try { await addCard(fd); setOpen(false); } catch (e) { setErr((e as Error).message); }
      })}
      className="card space-y-2 p-4"
    >
      <input name="bank" placeholder="Bank / account name" required className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
      <div className="grid grid-cols-3 gap-2">
        <select name="brand" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm">
          <option>VISA</option><option>MC</option><option>RuPay</option><option>AMEX</option>
        </select>
        <input name="last4" placeholder="Last 4" inputMode="numeric" maxLength={4} required className="min-w-0 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
        <input name="balance" placeholder="Balance" inputMode="decimal" type="number" step="0.01" className="min-w-0 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
      </div>
      {err && <p className="text-sm text-[#D92D20]">{err}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="flex-1 rounded-full bg-[#111114] py-2.5 text-sm font-semibold text-white disabled:opacity-40">{pending ? "Adding…" : "Add card"}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--line)] px-4 text-sm">Cancel</button>
      </div>
    </form>
  );
}

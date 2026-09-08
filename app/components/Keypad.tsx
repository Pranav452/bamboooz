"use client";
import { useState, useTransition } from "react";
import { addTransaction } from "@/app/actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

type Cat = { id: number; name: string; emoji: string; bg: string; kind: string };
type Card = { id: number; bank: string; last4: string };

export default function Keypad({
  categories, cards, currency,
}: { categories: Cat[]; cards: Card[]; currency: string }) {
  const expense = categories.filter((c) => c.kind === "expense");
  const income = categories.filter((c) => c.kind === "income");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState(expense[0]?.name ?? "");
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [cardId, setCardId] = useState(cards[0]?.id ?? 0);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const list = kind === "income" ? income : expense;
  const sym = currency === "INR" ? "₹" : "$";
  const value = parseFloat(amt) || 0;

  function press(k: string) {
    setAmt((a) => {
      if (k === "⌫") return a.slice(0, -1);
      if (k === ".") return a.includes(".") ? a : (a || "0") + ".";
      if (a.includes(".") && a.split(".")[1].length >= 2) return a;
      if (a.length >= 9) return a;
      return a === "0" ? k : a + k;
    });
  }

  function submit() {
    setErr("");
    const fd = new FormData();
    fd.set("amount", String(value));
    fd.set("kind", kind);
    fd.set("category", cat);
    fd.set("note", note);
    fd.set("merchant", merchant);
    if (cardId) fd.set("card_id", String(cardId));
    start(async () => {
      try { await addTransaction(fd); }
      catch (e) {
        const m = (e as Error).message;
        if (!m.includes("NEXT_REDIRECT")) setErr(m);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="soft flex p-1 text-sm">
        {(["expense", "income"] as const).map((k) => (
          <button key={k} onClick={() => { setKind(k); setCat((k === "income" ? income : expense)[0]?.name ?? ""); }}
            className={`flex-1 rounded-2xl py-2.5 capitalize transition ${kind === k ? "bg-white font-semibold shadow-sm" : "text-[var(--muted)]"}`}>
            {k}
          </button>
        ))}
      </div>

      <div className="card p-5 text-center">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Amount</div>
        <div className={`mt-1 text-5xl font-bold ${value ? "" : "text-[#D2D2D8]"}`}>{sym}{amt || "0"}</div>
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {list.map((c) => (
          <button key={c.id} onClick={() => setCat(c.name)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm transition ${
              cat === c.name ? "border-[#111114] bg-[#111114] text-white" : "border-[var(--line)] bg-white"}`}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant"
          className="min-w-0 rounded-2xl border border-[var(--line)] px-4 py-3 outline-none" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note"
          className="min-w-0 rounded-2xl border border-[var(--line)] px-4 py-3 outline-none" />
      </div>

      {cards.length > 1 && (
        <select value={cardId} onChange={(e) => setCardId(Number(e.target.value))}
          className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none">
          {cards.map((c) => <option key={c.id} value={c.id}>{c.bank} •••• {c.last4}</option>)}
        </select>
      )}

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button key={k} onClick={() => press(k)}
            className="soft py-4 text-xl font-medium active:bg-[#EDEDF0]">{k}</button>
        ))}
      </div>

      {err && <p className="rounded-2xl bg-[#FDE8E6] p-3 text-sm text-[#D92D20]">{err}</p>}

      <button onClick={submit} disabled={pending || value <= 0}
        className="w-full rounded-full bg-[#111114] py-4 text-[17px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-30">
        {pending ? "Saving…" : `Save ${kind}`}
      </button>
    </div>
  );
}

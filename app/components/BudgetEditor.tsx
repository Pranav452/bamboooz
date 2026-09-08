"use client";
import { useState, useTransition } from "react";
import { setBudget, deleteBudget } from "@/app/actions";

export default function BudgetEditor({
  categories, existing,
}: { categories: { id: number; name: string; emoji: string }[]; existing: string[] }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(categories[0]?.name ?? "");
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-full border border-[var(--line)] py-2.5 text-sm font-medium">
        Set a budget
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
      <div className="flex gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm">
          {categories.map((c) => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" placeholder="Amount"
          className="w-28 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="flex gap-2">
        <button
          disabled={pending || !(Number(amount) > 0)}
          onClick={() => start(async () => {
            const fd = new FormData(); fd.set("category", cat); fd.set("amount", amount);
            await setBudget(fd); setAmount(""); setOpen(false);
          })}
          className="flex-1 rounded-full bg-[#111114] py-2.5 text-sm font-semibold text-white disabled:opacity-30">
          {pending ? "Saving…" : "Save budget"}
        </button>
        {existing.includes(cat) && (
          <button onClick={() => start(() => deleteBudget(cat).then(() => setOpen(false)))}
            className="rounded-full border border-[var(--line)] px-4 text-sm text-[#D92D20]">Remove</button>
        )}
        <button onClick={() => setOpen(false)} className="rounded-full border border-[var(--line)] px-4 text-sm">Cancel</button>
      </div>
    </div>
  );
}

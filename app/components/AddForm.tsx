"use client";
import { useRef, useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import { addExpense } from "@/app/actions";

export default function AddForm({ today }: { today: string }) {
  const [cat, setCat] = useState<string>(CATEGORIES[0].key);
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          fd.set("category", cat);
          await addExpense(fd);
          formRef.current?.reset();
          setFlash("Saved ✓");
          setTimeout(() => setFlash(""), 1500);
        })
      }
      className="rounded-2xl bg-zinc-900 p-4 space-y-3"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-3xl text-zinc-500">₹</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          placeholder="0"
          autoFocus
          className="w-full bg-transparent text-5xl font-semibold outline-none placeholder:text-zinc-700"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={`rounded-xl px-2 py-3 text-sm leading-tight transition ${
              cat === c.key ? "bg-emerald-500 text-black font-semibold" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            <div className="text-xl">{c.emoji}</div>
            {c.key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input name="remarks" placeholder="Remarks (optional)" className="min-w-0 rounded-xl bg-zinc-800 px-3 py-3 outline-none" />
        <input name="spent_at" type="date" defaultValue={today} className="min-w-0 w-[9.5rem] appearance-none rounded-xl bg-zinc-800 px-3 py-3 outline-none text-zinc-300" />
      </div>

      <button
        disabled={pending}
        className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-black active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Saving…" : flash || "Add expense"}
      </button>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money, plain } from "@/lib/money";
import { updateSetting } from "@/app/actions";

export default function BalanceCard({
  balance, hidden, income, expenses, saved, currency,
}: { balance: number; hidden: boolean; income: number; expenses: number; saved: number; currency: string }) {
  // start at the real figure so a background tab (where animation frames never
  // fire) still shows the balance instead of zero
  const [shown, setShown] = useState(balance);
  const [hide, setHide] = useState(hidden);

  // count the balance up on mount, the way the design does
  useEffect(() => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      setShown(balance);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setShown(balance * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [balance]);

  const txt = money(shown, currency).replace(/^[+-]/, "");
  const [main, cents] = txt.split(".");

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Total Balance</span>
        <button
          onClick={() => { setHide(!hide); updateSetting("hide_balance", !hide); }}
          aria-label={hide ? "Show balance" : "Hide balance"}
          className="text-[var(--muted)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.6" />
            {hide && <path d="m4 4 16 16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      <div className="mt-1 text-[40px] font-bold leading-tight tracking-tight">
        {hide ? "••••••" : <>{main}<span className="text-2xl text-[var(--muted)]">.{cents}</span></>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-4 text-center">
        <div>
          <div className="text-[11px] text-[var(--muted)]">Income</div>
          <div className="text-sm font-semibold text-[#22A64A]">+{plain(income, currency)}</div>
        </div>
        <div className="border-x border-[var(--line)]">
          <div className="text-[11px] text-[var(--muted)]">Expenses</div>
          <div className="text-sm font-semibold text-[#F0362B]">-{plain(expenses, currency)}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--muted)]">Saved</div>
          <div className="text-sm font-semibold">{plain(saved, currency)}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href="/send" className="flex-1 rounded-full bg-[#111114] py-3 text-center text-sm font-semibold text-white">Send</Link>
        <Link href="/add" className="flex-1 rounded-full border border-[var(--line)] py-3 text-center text-sm font-semibold">Add</Link>
        <Link href="/overview" aria-label="Overview" className="grid w-12 place-items-center rounded-full border border-[var(--line)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></svg>
        </Link>
      </div>
    </section>
  );
}

import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { SubBar } from "../components/Header";
import TxRow from "../components/TxRow";

export const dynamic = "force-dynamic";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const u = await requireUser();
  const { q: query } = await searchParams;
  const term = (query ?? "").trim();
  const [p, results] = await Promise.all([
    q.profile(u.id),
    term ? q.searchTx(u.id, term) : q.recentTx(u.id, 8),
  ]);
  const currency = (p?.currency as string) ?? "INR";

  return (
    <>
      <SubBar title="Search" back="/" />
      <main className="safe-bot space-y-4 px-5">
        <form className="flex gap-2">
          <input name="q" defaultValue={term} autoFocus placeholder="Search merchant, note or category"
            className="min-w-0 flex-1 rounded-full border border-[var(--line)] px-4 py-3 text-sm outline-none" />
          <button className="rounded-full bg-[#111114] px-5 text-sm font-semibold text-white">Go</button>
        </form>
        <p className="text-xs text-[var(--muted)]">{term ? `${results.length} results for “${term}”` : "Recent transactions"}</p>
        {results.length === 0
          ? <p className="soft p-6 text-center text-sm text-[var(--muted)]">Nothing matched.</p>
          : <div className="card overflow-hidden">{results.map((t) => <TxRow key={t.id} tx={t} currency={currency} />)}</div>}
      </main>
    </>
  );
}

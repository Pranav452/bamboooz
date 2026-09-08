import Link from "next/link";
import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { plain } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Sent({
  searchParams,
}: { searchParams: Promise<{ ref?: string; amt?: string; to?: string }> }) {
  const u = await requireUser();
  const { ref, amt, to } = await searchParams;
  const [p, people] = await Promise.all([q.profile(u.id), q.recipients(u.id)]);
  const currency = (p?.currency as string) ?? "INR";
  const who = people.find((r) => String(r.id) === to);

  return (
    <main className="safe-top safe-bot flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="rise grid h-20 w-20 place-items-center rounded-full bg-[#E5F7EA] text-4xl">✓</div>
      <h1 className="mt-4 text-2xl font-bold">Transfer sent</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {plain(Number(amt) || 0, currency)} sent to {who?.name ?? "recipient"}
      </p>

      <div className="card mt-6 w-full divide-y divide-[var(--line)] text-sm">
        <div className="flex justify-between px-4 py-3"><span className="text-[var(--muted)]">Amount</span><span className="font-medium">{plain(Number(amt) || 0, currency)}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-[var(--muted)]">To</span><span className="font-medium">{who?.bank ?? who?.name ?? "—"}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-[var(--muted)]">Reference</span><span className="font-medium">{ref}</span></div>
      </div>

      <Link href="/" className="mt-6 w-full rounded-full bg-[#111114] py-4 text-[17px] font-semibold text-white">Done</Link>
    </main>
  );
}

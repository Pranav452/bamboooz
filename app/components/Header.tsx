import Link from "next/link";

export function TopBar({ name, unread, dateLabel }: { name: string; unread: number; dateLabel: string }) {
  const initials = (name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="safe-top flex items-center justify-between px-5 pb-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#111114] text-sm font-semibold text-white">{initials}</div>
        <div>
          <div className="text-xs text-[var(--muted)]">{dateLabel}</div>
          <div className="text-[17px] font-semibold">Hi, {name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)]">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        </Link>
        <Link href="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--line)]">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 16V11a6 6 0 1 0-12 0v5l-1.5 2.5h15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#F0362B] px-1 text-[11px] font-semibold text-white">{unread}</span>
          )}
        </Link>
      </div>
    </header>
  );
}

export function SubBar({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <header className="safe-top flex items-center justify-between px-5 pb-4">
      <Link href={back} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </Link>
      <h1 className="text-[17px] font-semibold">{title}</h1>
      <span className="h-10 w-10" />
    </header>
  );
}

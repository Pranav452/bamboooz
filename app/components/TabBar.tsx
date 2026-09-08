"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", d: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/insights", label: "Insights", d: "M4 20V10m5 10V4m5 16v-7m5 7V8" },
  { href: "/add", label: "Add", d: "M12 5v14M5 12h14" },
  { href: "/cards", label: "Cards", d: "M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20" },
  { href: "/profile", label: "Profile", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div className="flex items-center justify-between rounded-full border border-[var(--line)] bg-white/95 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.10)] backdrop-blur">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const isAdd = t.href === "/add";
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              className={`grid h-11 w-11 place-items-center rounded-full transition ${
                isAdd ? "bg-[#111114] text-white" : active ? "bg-[#F2F2F4] text-[#111114]" : "text-[#9A9AA0]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.d} />
              </svg>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

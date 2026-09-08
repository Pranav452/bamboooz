"use client";
import { useTransition } from "react";
import { markNotificationsRead } from "@/app/actions";

export default function MarkRead() {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => markNotificationsRead())} disabled={pending}
      className="w-full rounded-full border border-[var(--line)] py-2.5 text-sm font-medium disabled:opacity-50">
      {pending ? "Marking…" : "Mark all read"}
    </button>
  );
}

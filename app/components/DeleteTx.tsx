"use client";
import { useTransition } from "react";
import { deleteTransaction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DeleteTx({ id }: { id: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this transaction?")) return;
        start(async () => { await deleteTransaction(id); router.push("/transactions"); });
      }}
      className="w-full rounded-full border border-[var(--line)] py-3.5 text-sm font-semibold text-[#D92D20] disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete transaction"}
    </button>
  );
}

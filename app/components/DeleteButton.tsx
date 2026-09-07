"use client";
import { useTransition } from "react";
import { removeExpense } from "@/app/actions";

export default function DeleteButton({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => { if (confirm("Delete this expense?")) start(() => removeExpense(id)); }}
      disabled={pending}
      className="text-zinc-600 px-2 text-lg active:text-red-400"
      aria-label="Delete"
    >
      ×
    </button>
  );
}

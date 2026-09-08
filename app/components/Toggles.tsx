"use client";
import { useState } from "react";
import { updateSetting } from "@/app/actions";

function Row({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm">{label}</span>
      <button
        role="switch" aria-checked={on} aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[#22C55E]" : "bg-[#D9D9DE]"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function Toggles({ faceId, push, hideBalance }: { faceId: boolean; push: boolean; hideBalance: boolean }) {
  const [a, setA] = useState(faceId);
  const [b, setB] = useState(push);
  const [c, setC] = useState(hideBalance);
  return (
    <section className="card divide-y divide-[var(--line)]">
      <Row label="Face ID unlock" on={a} onChange={(v) => { setA(v); updateSetting("face_id", v); }} />
      <Row label="Push notifications" on={b} onChange={(v) => { setB(v); updateSetting("push_enabled", v); }} />
      <Row label="Hide balance" on={c} onChange={(v) => { setC(v); updateSetting("hide_balance", v); }} />
    </section>
  );
}

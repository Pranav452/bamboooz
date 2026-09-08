"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signUp = mode === "sign-up";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (signUp) await authClient.signUp.email({ email, password, name });
      else await authClient.signIn.email({ email, password });
      router.push("/");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message || "Could not sign you in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="safe-top mx-auto max-w-sm px-6 py-12">
      <h1 className="text-3xl font-bold">{signUp ? "Create account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {signUp ? "Start tracking where your money goes." : "Sign in to your expense tracker."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        {signUp && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required
            className="w-full rounded-2xl border border-[var(--line)] px-4 py-3.5 outline-none" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required autoComplete="email"
          className="w-full rounded-2xl border border-[var(--line)] px-4 py-3.5 outline-none" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required
          autoComplete={signUp ? "new-password" : "current-password"} minLength={8}
          className="w-full rounded-2xl border border-[var(--line)] px-4 py-3.5 outline-none" />

        {err && <p className="rounded-2xl bg-[#FDE8E6] p-3 text-sm text-[#D92D20]">{err}</p>}

        <button disabled={busy} className="w-full rounded-full bg-[#111114] py-4 text-[17px] font-semibold text-white disabled:opacity-40">
          {busy ? "Please wait…" : signUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
        className="mt-3 w-full rounded-full border border-[var(--line)] py-4 text-[15px] font-semibold">
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {signUp ? "Already have an account? " : "New here? "}
        <Link href={signUp ? "/auth/sign-in" : "/auth/sign-up"} className="font-semibold text-[#0A7AFF]">
          {signUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </main>
  );
}

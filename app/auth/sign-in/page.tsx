import Link from "next/link";
import { authEnabled } from "@/lib/auth/server";
import AuthForm from "../AuthForm";

export const dynamic = "force-dynamic";

export default function SignIn() {
  if (!authEnabled) {
    return (
      <main className="safe-top px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Demo mode</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Neon Auth is not configured, so the app is open without sign-in.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-[#111114] px-6 py-3 text-sm font-semibold text-white">Open the app</Link>
      </main>
    );
  }
  return <AuthForm mode="sign-in" />;
}

import { authEnabled } from "@/lib/auth/server";
import AuthForm from "../AuthForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignUp() {
  if (!authEnabled) redirect("/auth/sign-in");
  return <AuthForm mode="sign-up" />;
}

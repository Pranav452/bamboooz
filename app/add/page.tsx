import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import TabBar from "../components/TabBar";
import Keypad from "../components/Keypad";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const u = await requireUser();
  const [cats, cards, p] = await Promise.all([q.categories(u.id), q.cards(u.id), q.profile(u.id)]);
  return (
    <>
      <h1 className="safe-top px-5 pb-3 text-2xl font-bold">Add Transaction</h1>
      <main className="safe-bot px-5">
        <Keypad categories={cats} cards={cards} currency={(p?.currency as string) ?? "INR"} />
      </main>
      <TabBar />
    </>
  );
}

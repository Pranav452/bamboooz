import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { plain } from "@/lib/money";
import TabBar from "../components/TabBar";
import CardItem, { AddCardForm } from "../components/CardItem";

export const dynamic = "force-dynamic";

export default async function Cards() {
  const u = await requireUser();
  const [cards, p] = await Promise.all([q.cards(u.id), q.profile(u.id)]);
  const currency = (p?.currency as string) ?? "INR";
  return (
    <>
      <h1 className="safe-top px-5 pb-3 text-2xl font-bold">My Cards</h1>
      <main className="safe-bot space-y-4 px-5">
        {cards.map((c) => <CardItem key={c.id} card={c} label={plain(c.balance, currency)} />)}
        {cards.length === 0 && <p className="soft p-4 text-sm text-[var(--muted)]">No cards yet.</p>}
        <AddCardForm />
      </main>
      <TabBar />
    </>
  );
}

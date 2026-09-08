import { requireUser } from "@/lib/user";
import * as q from "@/lib/queries";
import { SubBar } from "../components/Header";
import SendForm from "../components/SendForm";

export const dynamic = "force-dynamic";

export default async function Send() {
  const u = await requireUser();
  const [cards, people, p, recent] = await Promise.all([
    q.cards(u.id), q.recipients(u.id), q.profile(u.id), q.transfers(u.id, 5),
  ]);
  return (
    <>
      <SubBar title="Send Money" back="/" />
      <main className="safe-bot px-5">
        <SendForm
          cards={cards}
          recipients={people}
          currency={(p?.currency as string) ?? "INR"}
          recent={recent.map((t) => ({ id: t.id, amount: t.amount, recipient: t.recipient, reference: t.reference }))}
        />
      </main>
    </>
  );
}

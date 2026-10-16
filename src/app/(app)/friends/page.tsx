import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AddFriendForm, Leaderboard, RequestRow } from "@/components/friends";
import { currentUser } from "@/lib/auth";
import { getLeaderboard, getRequests } from "@/lib/friends";

export const metadata: Metadata = { title: "Друзья" };
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const [standings, requests] = await Promise.all([getLeaderboard(user.id), getRequests(user.id)]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Друзья</h1>
          <p className="text-sm text-muted">Учиться вместе проще: видно, кто сегодня уже занимался, а на арене можно помериться силами.</p>
        </div>

        <Leaderboard standings={standings} />

        {standings.length === 1 && (
          <p className="rounded-xl border border-dashed border-line-strong px-5 py-6 text-center text-sm text-muted">
            Пока в таблице только ты. Добавь друга по email — справа.
          </p>
        )}
      </div>

      <aside className="space-y-4">
        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Добавить друга</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Друг должен быть зарегистрирован в 365step.</p>
          <AddFriendForm />
        </section>

        {requests.incoming.length > 0 && (
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Заявки в друзья</h2>
            <ul className="mt-1 divide-y divide-line">
              {requests.incoming.map((r) => (
                <RequestRow key={r.id} request={r} incoming />
              ))}
            </ul>
          </section>
        )}

        {requests.outgoing.length > 0 && (
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Отправленные</h2>
            <ul className="mt-1 divide-y divide-line">
              {requests.outgoing.map((r) => (
                <RequestRow key={r.id} request={r} incoming={false} />
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}

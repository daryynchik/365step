import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { currentUser } from "@/lib/auth";
import { getRequests } from "@/lib/friends";
import { getStats } from "@/lib/game";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const [stats, requests] = await Promise.all([getStats(user.id), getRequests(user.id)]);

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        level: stats.level.level,
        balance: stats.balance,
        streak: stats.streak.current,
        activeToday: stats.streak.activeToday,
        pendingRequests: requests.incoming.length,
      }}
    >
      {children}
    </AppShell>
  );
}

import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { currentUser } from "@/lib/auth";
import { getRequests } from "@/lib/friends";
import { getStats } from "@/lib/game";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  // Everything inside the app is built around the student's goal.
  if (!(await getProfile(user.id))) redirect("/start");

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

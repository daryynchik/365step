import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { currentUser } from "@/lib/auth";
import { getFightRequests } from "@/lib/arena";
import { getRequests } from "@/lib/friends";
import { getStats } from "@/lib/game";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const [profile, stats, requests, fights] = await Promise.all([
    getProfile(user.id),
    getStats(user.id),
    getRequests(user.id),
    getFightRequests(user.id),
  ]);
  // Everything inside the app is built around the student's goal.
  if (!profile) redirect("/start");

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
        pendingFights: fights.filter((r) => r.defenderId === user.id).length,
      }}
    >
      {children}
    </AppShell>
  );
}

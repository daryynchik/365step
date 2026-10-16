import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CompeteTabs } from "@/components/compete-tabs";
import { RewardProvider } from "@/components/reward-toast";
import { SkeletonCard } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { listBattles } from "@/lib/battles";
import { getDailyChallenge, getLeaderboard } from "@/lib/daily-challenge";
import { getFriends, getPendingRequests } from "@/lib/friends";

export const metadata: Metadata = { title: "Compete" };
export const dynamic = "force-dynamic";

/**
 * Compete: the daily SAT challenge, friend battles and friends, in one hub.
 *
 * Kept as a single nav destination rather than three, so the tab bar does not
 * outgrow a phone screen — see the tab switcher in CompeteTabs.
 */
export default function CompetePage() {
  return (
    <RewardProvider>
      <div className="space-y-6">
        <header>
          <p className="eyebrow mb-1.5">Compete</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Today&apos;s challenge, and your friends
          </h1>
          <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
            One SAT challenge a day for everyone, and head-to-head battles against the
            friends you add. Neither replaces the daily plan — they are a different way to
            practise the same material.
          </p>
        </header>

        <Suspense fallback={<SkeletonCard lines={5} />}>
          <CompeteContent />
        </Suspense>
      </div>
    </RewardProvider>
  );
}

async function CompeteContent() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const [challenge, leaderboard, friends, pending, battles] = await Promise.all([
    getDailyChallenge(user.id),
    getLeaderboard(user.id),
    getFriends(user.id),
    getPendingRequests(user.id),
    listBattles(user.id),
  ]);

  return (
    <CompeteTabs
      currentUserId={user.id}
      daily={{
        date: challenge.date,
        questions: challenge.questions,
        attempted: challenge.attempted,
        myResult: challenge.myResult,
        leaderboard,
      }}
      friends={friends}
      incoming={pending.incoming}
      outgoing={pending.outgoing}
      battles={battles}
    />
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Swords, Users, Zap } from "lucide-react";
import clsx from "clsx";

import type { LeaderboardEntry } from "@/lib/daily-challenge";
import type { FriendshipRow, FriendUser } from "@/lib/friends";
import type { BattleView } from "@/lib/battles";
import type { PublicQuizQuestion } from "@/lib/types";
import { BattlesPanel, type PendingChallenge } from "./battles-panel";
import { DailyChallengePanel } from "./daily-challenge-panel";
import { FriendsPanel } from "./friends-panel";

type Tab = "daily" | "battles" | "friends";

const TABS: { value: Tab; label: string; icon: typeof Zap }[] = [
  { value: "daily", label: "Daily Challenge", icon: Zap },
  { value: "battles", label: "Battles", icon: Swords },
  { value: "friends", label: "Friends", icon: Users },
];

export function CompeteTabs({
  currentUserId,
  daily,
  friends,
  incoming,
  outgoing,
  battles,
}: {
  currentUserId: string;
  daily: {
    date: string;
    questions: PublicQuizQuestion[];
    attempted: boolean;
    myResult: { correct: number; total: number; seconds: number } | null;
    leaderboard: LeaderboardEntry[];
  };
  friends: FriendshipRow[];
  incoming: FriendshipRow[];
  outgoing: FriendshipRow[];
  battles: BattleView[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "daily";
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge | null>(null);

  function goTo(next: Tab) {
    const merged = new URLSearchParams(params.toString());
    merged.set("tab", next);
    router.push(`/compete/practice?${merged}`);
  }

  const friendUsers: FriendUser[] = friends.map((f) => f.friend);

  return (
    <div>
      <div
        className="mb-5 flex gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Compete sections"
      >
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => goTo(value)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all",
              tab === value
                ? "bg-[var(--btn-bg)] text-[var(--btn-fg)]"
                : "muted hover:bg-[var(--bg-sunken)] hover:text-[var(--fg)]",
            )}
          >
            <Icon className="size-3.5" />
            {label}
            {value === "friends" && incoming.length > 0 ? (
              <span className="nums flex size-4 items-center justify-center rounded-full bg-[var(--color-urgent)] text-[10px] font-semibold text-white">
                {incoming.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "daily" ? (
        <DailyChallengePanel
          date={daily.date}
          questions={daily.questions}
          attempted={daily.attempted}
          myResult={daily.myResult}
          leaderboard={daily.leaderboard}
        />
      ) : null}

      {tab === "battles" ? (
        <BattlesPanel
          battles={battles}
          friends={friendUsers}
          currentUserId={currentUserId}
          pendingChallenge={pendingChallenge}
          onChallengeHandled={() => setPendingChallenge(null)}
        />
      ) : null}

      {tab === "friends" ? (
        <FriendsPanel
          friends={friends}
          incoming={incoming}
          outgoing={outgoing}
          onBattle={(friendId, friendName) => {
            setPendingChallenge({ friendId, friendName });
            goTo("battles");
          }}
        />
      ) : null}
    </div>
  );
}

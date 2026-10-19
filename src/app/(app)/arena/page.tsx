import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RaceLobby } from "@/components/arena/race-lobby";
import { getRacer } from "@/lib/arena";
import { currentUser } from "@/lib/auth";
import { nowMs } from "@/lib/date";
import { getFriendIds } from "@/lib/friends";
import { activeRaceId, getInvites, getRating, recentRaces } from "@/lib/race";
import { isTrack } from "@/lib/race-rules";

export const metadata: Metadata = { title: "Соревнования" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ track?: string; friend?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { track, friend } = await searchParams;
  const now = nowMs();

  const me = await getRacer(user.id);
  const [sat, ielts, active, invites, recent, friendIds] = await Promise.all([
    getRating(user.id, "sat"),
    getRating(user.id, "ielts"),
    activeRaceId(user.id),
    getInvites(user.id, now),
    recentRaces(user.id),
    getFriendIds(user.id),
  ]);
  const friends = await Promise.all(friendIds.map((id) => getRacer(id)));
  friends.sort((a, b) => (a.userId === friend ? -1 : b.userId === friend ? 1 : a.name.localeCompare(b.name, "ru")));

  return (
    <RaceLobby
      me={me}
      ratings={{ sat, ielts }}
      initialTrack={isTrack(track) ? track : sat.games >= ielts.games ? "sat" : "ielts"}
      activeRaceId={active}
      friends={friends}
      invites={invites}
      recent={recent}
      highlightFriend={friend ?? null}
    />
  );
}

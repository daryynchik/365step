import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RaceView } from "@/components/arena/race-view";
import { currentUser } from "@/lib/auth";
import { nowMs } from "@/lib/date";
import { raceView } from "@/lib/race";

export const metadata: Metadata = { title: "Соревнование" };
export const dynamic = "force-dynamic";

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { id } = await params;
  const view = await raceView(user.id, id, nowMs());
  if (!view) notFound();
  return <RaceView initial={view} />;
}

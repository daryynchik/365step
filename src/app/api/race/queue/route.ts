import { NextResponse } from "next/server";

import { joinQueue, leaveQueue, pollQueue } from "@/lib/race";
import { body, json, signedIn } from "../http";

export const dynamic = "force-dynamic";

/** The searcher's heartbeat: still searching, matched (race id), or not in the queue. */
export async function GET() {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  return json({ ok: true, queue: await pollQueue(user.id, Date.now()) });
}

/** Start looking for an opponent in a track. `?cancel=1` stops looking (sent by sendBeacon when the page closes). */
export async function POST(request: Request) {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  if (new URL(request.url).searchParams.get("cancel")) {
    await leaveQueue(user.id);
    return json({ ok: true });
  }
  const { track } = await body(request);
  const result = await joinQueue(user.id, String(track), Date.now());
  return json(result, result.ok ? 200 : 400);
}

/** Stop looking. */
export async function DELETE() {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  await leaveQueue(user.id);
  return json({ ok: true });
}

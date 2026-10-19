import { NextResponse } from "next/server";

import { activeRaceId, getInvites } from "@/lib/race";
import { json, signedIn } from "../http";

export const dynamic = "force-dynamic";

/** What the lobby needs to react to: a race that started (e.g. an accepted invitation) and pending invitations. */
export async function GET() {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  const now = Date.now();
  const [raceId, invites] = await Promise.all([activeRaceId(user.id), getInvites(user.id, now)]);
  return json({ ok: true, raceId, invites, serverNow: now });
}

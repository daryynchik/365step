import { NextResponse } from "next/server";

import { forfeit, raceView, submitAnswer } from "@/lib/race";
import { body, json, signedIn } from "../http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** The race as this participant sees it; also their presence heartbeat. */
export async function GET(request: Request, { params }: Params) {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  // Polls skip names and looks (`?racers=0`): they never change during a race.
  const racers = new URL(request.url).searchParams.get("racers") !== "0";
  const view = await raceView(user.id, id, Date.now(), { racers });
  return view ? json({ ok: true, race: view }) : json({ ok: false, error: "Гонка не найдена." }, 404);
}

/** { action: "answer", round, response } or { action: "forfeit" }. */
export async function POST(request: Request, { params }: Params) {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const data = await body(request);
  const now = Date.now();
  if (data.action === "forfeit") return json(await forfeit(user.id, id, now));
  if (data.action === "answer") {
    const response = data.response;
    if (typeof response !== "number" && typeof response !== "string") return json({ ok: false, error: "Пустой ответ." }, 400);
    return json(await submitAnswer(user.id, id, Number(data.round), response, now));
  }
  return json({ ok: false, error: "Неизвестное действие." }, 400);
}

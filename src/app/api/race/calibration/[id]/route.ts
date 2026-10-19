import { NextResponse } from "next/server";

import { answerCalibration, calibrationView } from "@/lib/race";
import { body, json, signedIn } from "../../http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const view = await calibrationView(user.id, id);
  return view ? json({ ok: true, calibration: view }) : json({ ok: false, error: "Калибровка не найдена." }, 404);
}

export async function POST(request: Request, { params }: Params) {
  const user = await signedIn();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const data = await body(request);
  const response = data.response;
  if (typeof response !== "number" && typeof response !== "string") return json({ ok: false, error: "Пустой ответ." }, 400);
  return json(await answerCalibration(user.id, id, Number(data.index), response));
}

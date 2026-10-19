import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Calibration } from "@/components/arena/calibration";
import { currentUser } from "@/lib/auth";
import { calibrationView } from "@/lib/race";

export const metadata: Metadata = { title: "Калибровка" };
export const dynamic = "force-dynamic";

export default async function CalibratePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { id } = await params;
  const view = await calibrationView(user.id, id);
  if (!view) notFound();
  return <Calibration initial={view} />;
}

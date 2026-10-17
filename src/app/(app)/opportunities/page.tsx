import type { Metadata } from "next";

import { OpportunityCatalog } from "@/components/opportunity-catalog";
import { OPPORTUNITIES } from "@/content/opportunities";
import { requireUser } from "@/lib/auth";
import { getDeadlines } from "@/lib/deadlines";

export const metadata: Metadata = { title: "Конкурсы и программы" };
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const user = await requireUser();
  const deadlines = await getDeadlines(user.id);
  return <OpportunityCatalog opportunities={OPPORTUNITIES} userId={user.id} tracked={deadlines.map((d) => `${d.title}|${d.dueDate}`)} today={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Almaty" })} />;
}

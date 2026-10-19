import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WardrobeItems } from "@/components/arena/accessory-store";
import { LooksEditor } from "@/components/arena/looks-editor";
import { getHero, getWardrobe } from "@/lib/arena";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Гардероб" };
export const dynamic = "force-dynamic";

export default async function WardrobePage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const [hero, wardrobe] = await Promise.all([getHero(user.id), getWardrobe(user.id)]);
  return (
    <div className="space-y-8">
      <WardrobeItems look={hero.look} owned={wardrobe.owned} outfit={wardrobe.outfit} balance={wardrobe.balance} />
      <LooksEditor initialLook={hero.look} chosen={hero.chosen} outfit={wardrobe.outfit} />
    </div>
  );
}

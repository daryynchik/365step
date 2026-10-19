import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Shop } from "@/components/arena/accessory-store";
import { getHero, getWardrobe } from "@/lib/arena";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Магазин аксессуаров" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const [hero, wardrobe] = await Promise.all([getHero(user.id), getWardrobe(user.id)]);
  return <Shop look={hero.look} owned={wardrobe.owned} outfit={wardrobe.outfit} balance={wardrobe.balance} />;
}

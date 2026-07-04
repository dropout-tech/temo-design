import { AwardLogoManager } from "@/components/studio/award-logo-manager"
import { getAwardLogos } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "得獎紀錄 — TEMO Studio" }

export default async function StudioAwardsPage() {
  const items = await getAwardLogos()
  return (
    <AwardLogoManager
      initial={items.map((a) => ({
        key: a.id,
        id: a.id,
        name: a.name,
        image_url: a.image_url,
        sort: a.sort,
      }))}
    />
  )
}

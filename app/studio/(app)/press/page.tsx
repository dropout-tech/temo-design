import { PressLinkManager } from "@/components/studio/press-link-manager"
import { getPressLinks } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "媒體報導 — TEMO Studio" }

export default async function StudioPressPage() {
  const items = await getPressLinks()
  return (
    <PressLinkManager
      initial={items.map((p) => ({
        key: p.id,
        id: p.id,
        title: p.title,
        source: p.source,
        url: p.url,
        image_url: p.image_url,
        sort: p.sort,
      }))}
    />
  )
}

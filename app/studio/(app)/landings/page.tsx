import { LandingManager } from "@/components/studio/landing-manager"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "服務落地頁 — TEMO Studio" }

export default async function StudioLandingsPage() {
  const supabase = await createClient()
  const [{ data: landings }, { data: categoryGroups }] = await Promise.all([
    supabase
      .from("category_landings")
      .select(
        "slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort"
      )
      .order("sort"),
    supabase.from("category_groups").select("value, label").order("sort"),
  ])

  return (
    <LandingManager landings={landings ?? []} categoryOptions={categoryGroups ?? []} />
  )
}

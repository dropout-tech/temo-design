import { CategoryManager } from "@/components/studio/category-manager"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "作品分類 — TEMO Studio" }

export default async function StudioCategoriesPage() {
  const supabase = await createClient()
  const [groupsRes, { data: industries }, { data: landings }] = await Promise.all([
    supabase.from("category_groups").select("value, label, sort, landing_slug").order("sort"),
    supabase.from("industries").select("value, label, sort").order("sort"),
    supabase.from("category_landings").select("slug, num, title_en").order("sort"),
  ])

  // migration 0018 未套用時 landing_slug 欄位不存在：退回舊查詢，歸屬選單先不顯示
  const categoryGroups = groupsRes.error
    ? (await supabase.from("category_groups").select("value, label, sort").order("sort")).data
    : groupsRes.data

  const landingOptions = groupsRes.error
    ? []
    : (landings ?? []).map((l) => ({
        value: l.slug as string,
        label: `${l.num} ${((l.title_en as string[]) ?? []).join(" ")}`,
      }))

  return (
    <CategoryManager
      categoryGroups={categoryGroups ?? []}
      industries={industries ?? []}
      landingOptions={landingOptions}
    />
  )
}

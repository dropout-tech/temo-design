import { CategoryManager } from "@/components/studio/category-manager"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "作品分類 — TEMO Studio" }

export default async function StudioCategoriesPage() {
  const supabase = await createClient()
  const [{ data: categoryGroups }, { data: industries }] = await Promise.all([
    supabase.from("category_groups").select("value, label, sort").order("sort"),
    supabase.from("industries").select("value, label, sort").order("sort"),
  ])

  return (
    <CategoryManager
      categoryGroups={categoryGroups ?? []}
      industries={industries ?? []}
    />
  )
}

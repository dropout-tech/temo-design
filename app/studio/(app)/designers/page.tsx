import { DesignerManager } from "@/components/studio/designer-manager"
import { getTeamForStudio } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "設計師 / 團隊 — TEMO Studio" }

export default async function StudioDesignersPage() {
  const rows = await getTeamForStudio()
  const categories = Array.from(new Set(rows.map((r) => r.category)))
  return (
    <DesignerManager
      categories={categories}
      initial={rows.map((r) => ({
        key: r.id,
        id: r.id,
        slug: r.slug ?? "",
        name: r.name,
        name_zh: r.name_zh ?? "",
        role: r.role ?? "",
        category: r.category,
        photo_url: r.photo_url ?? "",
        instagram: r.instagram ?? "",
        bio: (r.bio ?? []).join("\n"),
        achievements: (r.achievements ?? []).join("\n"),
        tags: (r.tags ?? []).join("\n"),
        has_page: r.has_page,
        sort: r.sort,
      }))}
    />
  )
}

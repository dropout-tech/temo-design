import { DesignerManager } from "@/components/studio/designer-manager"
import { getTeamForStudio, getTeamCategories } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "團隊成員 — TEMO Studio" }

export default async function StudioDesignersPage() {
  const [rows, categories] = await Promise.all([
    getTeamForStudio(),
    getTeamCategories(),
  ])
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
        facebook: r.facebook ?? "",
        website: r.website ?? "",
        phone: r.phone ?? "",
        address: r.address ?? "",
        email: r.email ?? "",
        show_contact: r.show_contact ?? false,
        bio: (r.bio ?? []).join("\n"),
        achievements: (r.achievements ?? []).join("\n"),
        tags: (r.tags ?? []).join("\n"),
        has_page: r.has_page,
        sort: r.sort,
      }))}
    />
  )
}

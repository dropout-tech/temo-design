import { createClient } from "@/lib/supabase/server"
import { WorksManager, type StudioWorkRow } from "@/components/studio/works-manager"

export const dynamic = "force-dynamic"
export const metadata = { title: "作品管理 — TEMO Studio" }

type WorkRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_url: string | null
  year: string | null
  published: boolean
  size: "large" | "medium" | "small"
  sort: number
  category_groups: { label: string } | null
  clients: { name: string } | null
}

async function getWorks(): Promise<WorkRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("works")
    .select(
      "id, slug, title, subtitle, cover_url, year, published, size, sort, category_groups(label), clients(name)"
    )
    .order("sort")
  return (data as unknown as WorkRow[]) ?? []
}

export default async function StudioWorksPage() {
  const works = await getWorks()

  return <WorksManager initialWorks={works as StudioWorkRow[]} />
}

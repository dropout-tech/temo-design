import { BriefManager, type BriefSectionRow } from "@/components/studio/brief-manager"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "報價問卷 — TEMO Studio" }

export default async function StudioBriefPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("brief_sections")
    .select(
      "id, title, title_en, description, applies_to, sort, brief_questions(id, section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort)"
    )
    .order("sort")

  const sections: BriefSectionRow[] = ((data ?? []) as any[]).map((s) => ({
    id: s.id,
    title: s.title,
    title_en: s.title_en,
    description: s.description,
    applies_to: s.applies_to,
    sort: s.sort,
    brief_questions: (s.brief_questions ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0)),
  }))

  return <BriefManager sections={sections} />
}

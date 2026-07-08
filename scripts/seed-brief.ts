// 從 lib/quote-brief-questions.ts 的 briefSections 產生 seed SQL（輸出到 stdout）。
// 用法：npx tsx scripts/seed-brief.ts | psql "$DATABASE_URI"
// 產生的 SQL 包在「表為空才執行」的保護中，可安全重跑、不覆蓋日後後台的編輯。
import { briefSections } from "../lib/quote-brief-questions"

const qt = (s: string | undefined | null): string =>
  s == null ? "null" : "'" + String(s).replace(/'/g, "''") + "'"
const arr = (a: string[] | undefined): string =>
  !a || a.length === 0 ? "null" : "array[" + a.map(qt).join(",") + "]::text[]"
const jsonb = (a: string[] | undefined): string =>
  "'" + JSON.stringify(a ?? []).replace(/'/g, "''") + "'::jsonb"

const out: string[] = []
out.push("-- ===== 附加：seed（由 scripts/seed-brief.ts 產生；表為空時才執行）=====")
out.push("do $$ begin")
out.push("if not exists (select 1 from brief_sections) then")
briefSections.forEach((s, si) => {
  out.push(
    `  insert into brief_sections (id, title, title_en, description, applies_to, sort) values (${qt(s.id)}, ${qt(s.title)}, ${qt(s.titleEn)}, ${qt(s.description)}, ${arr(s.appliesTo)}, ${si});`
  )
  s.questions.forEach((q, qi) => {
    out.push(
      `  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values (${qt(s.id)}, ${qt(q.id)}, ${qt(q.label)}, ${qt(q.hint)}, ${qt(q.type)}, ${q.required ? "true" : "false"}, ${jsonb(q.options)}, ${qt(q.placeholder)}, ${q.allowOther ? "true" : "false"}, ${qi});`
    )
  })
})
out.push("end if;")
out.push("end $$;")
console.log(out.join("\n"))

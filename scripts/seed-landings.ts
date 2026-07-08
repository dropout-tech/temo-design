// 從 lib/category-landing-data.ts 的 CATEGORY_LANDINGS 產生 seed SQL。
// 用法：npx tsx scripts/seed-landings.ts | psql "$DATABASE_URI"
// 包在「表為空才執行」的保護中，可安全重跑。
import { CATEGORY_LANDINGS } from "../lib/category-landing-data"

const qt = (s: string | undefined | null): string =>
  s == null ? "null" : "'" + String(s).replace(/'/g, "''") + "'"
const arr = (a: string[] | undefined): string =>
  !a || a.length === 0 ? "'{}'::text[]" : "array[" + a.map(qt).join(",") + "]::text[]"

const out: string[] = []
out.push("-- ===== 附加：seed（由 scripts/seed-landings.ts 產生；表為空時才執行）=====")
out.push("do $$ begin")
out.push("if not exists (select 1 from category_landings) then")
CATEGORY_LANDINGS.forEach((c, i) => {
  out.push(
    `  insert into category_landings (slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort) values (${qt(c.slug)}, ${qt(c.num)}, ${arr(c.titleEn)}, ${qt(c.taglineZh)}, ${qt(c.taglineEn)}, ${qt(c.cta?.label)}, ${qt(c.cta?.href)}, ${qt(c.portfolioGroup)}, ${c.hideFilters ? "true" : "false"}, ${i});`
  )
})
out.push("end if;")
out.push("end $$;")
console.log(out.join("\n"))

/**
 * 從 lib/portfolio-data.ts 的真實資料產生 Supabase 匯入用 SQL。
 * 直接讀現有資料 → 避免手抄出錯，且與網站上顯示的內容 100% 一致。
 *
 * 用法：tsx scripts/export-seed-sql.ts > out.sql
 *      psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f out.sql
 *
 * 匯入範圍（階段 1 作品切片）：category_groups / industries / clients / works / work_industries。
 * 設計師（designers）與 作品↔設計師（work_designers）另外處理（見 CMS_BLUEPRINT.md 決策 1）。
 */
import { CATEGORY_GROUPS, INDUSTRIES, CLIENTS, WORKS } from "../lib/portfolio-data"

const q = (v: unknown) =>
  v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`
const qarr = (a?: readonly string[]) =>
  !a || a.length === 0 ? "'{}'" : `ARRAY[${a.map(q).join(",")}]::text[]`

const lines: string[] = []
lines.push("begin;")

// ── 執行項目 ──
lines.push("\n-- category_groups")
CATEGORY_GROUPS.forEach((c, i) => {
  lines.push(
    `insert into category_groups (value,label,sort) values (${q(c.value)},${q(c.label)},${i}) ` +
      `on conflict (value) do update set label=excluded.label, sort=excluded.sort;`
  )
})

// ── 行業分類 ──
lines.push("\n-- industries")
INDUSTRIES.forEach((c, i) => {
  lines.push(
    `insert into industries (value,label,sort) values (${q(c.value)},${q(c.label)},${i}) ` +
      `on conflict (value) do update set label=excluded.label, sort=excluded.sort;`
  )
})

// ── 客戶 ──
lines.push("\n-- clients")
CLIENTS.forEach((c) => {
  lines.push(
    `insert into clients (slug,name,brief) values (${q(c.slug)},${q(c.name)},${q(c.brief)}) ` +
      `on conflict (slug) do update set name=excluded.name, brief=excluded.brief;`
  )
})

// ── 作品 ──
lines.push("\n-- works")
WORKS.forEach((w) => {
  const clientId = `(select id from clients where slug=${q(w.clientSlug)})`
  lines.push(
    `insert into works (slug,title,subtitle,category_group,year,client_id,cover_url,video_url,size,description,` +
      `services,deliverables,challenge,approach,result,quote_text,quote_author,awards,sort,published) values (` +
      [
        q(w.slug),
        q(w.title),
        q(w.subtitle),
        q(w.categoryGroup),
        q(w.year),
        clientId,
        q(w.cover),
        q(w.videoUrl),
        q(w.size),
        q(w.description),
        qarr(w.services),
        qarr(w.deliverables),
        q(w.challenge),
        q(w.approach),
        q(w.result),
        q(w.quote?.text),
        q(w.quote?.author),
        qarr(w.awards),
        String(w.id),
        "true",
      ].join(",") +
      `) on conflict (slug) do update set ` +
      `title=excluded.title, subtitle=excluded.subtitle, category_group=excluded.category_group, ` +
      `year=excluded.year, client_id=excluded.client_id, cover_url=excluded.cover_url, ` +
      `video_url=excluded.video_url, size=excluded.size, description=excluded.description, ` +
      `services=excluded.services, deliverables=excluded.deliverables, challenge=excluded.challenge, ` +
      `approach=excluded.approach, result=excluded.result, quote_text=excluded.quote_text, ` +
      `quote_author=excluded.quote_author, awards=excluded.awards;`
  )
})

// ── 作品 ↔ 行業（多對多） ──
lines.push("\n-- work_industries")
WORKS.forEach((w) => {
  w.industries.forEach((ind) => {
    lines.push(
      `insert into work_industries (work_id, industry_value) ` +
        `select id, ${q(ind)} from works where slug=${q(w.slug)} on conflict do nothing;`
    )
  })
})

lines.push("\ncommit;")
process.stdout.write(lines.join("\n") + "\n")

/**
 * 從 lib/team-data.ts 產生 designers 匯入 SQL（真實團隊名冊）。
 * 用法：tsx scripts/export-designers-sql.ts | psql "$DATABASE_URI"
 *
 * 有 slug 的人（設計師 + 專利師顧問）視為有獨立頁（has_page=true）；
 * 廠商/夥伴為佔位、無 slug。作品↔設計師的對應留待後台由使用者設定。
 */
import { TEAM, CATEGORY_ORDER } from "../lib/team-data"

const q = (v: unknown) =>
  v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`
const qarr = (a?: readonly string[]) =>
  !a || a.length === 0 ? "'{}'" : `ARRAY[${a.map(q).join(",")}]::text[]`

const lines: string[] = []
lines.push("begin;")
// work_designers 目前為空，可安全清空 designers 重灌（idempotent）
lines.push("delete from work_designers;")
lines.push("delete from designers;")

let sort = 0
for (const category of CATEGORY_ORDER) {
  for (const p of TEAM[category]) {
    const hasPage = Boolean(p.slug)
    lines.push(
      `insert into designers (slug,name,name_zh,role,category,photo_url,instagram,bio,achievements,tags,has_page,sort) values (` +
        [
          q(p.slug),
          q(p.name),
          q(p.nameZh),
          q(p.role),
          q(category),
          q(p.image),
          q(p.instagram),
          qarr(p.bio),
          qarr(p.achievements),
          qarr(p.tags),
          hasPage ? "true" : "false",
          String(sort++),
        ].join(",") +
        `);`
    )
  }
}

lines.push("commit;")
process.stdout.write(lines.join("\n") + "\n")

/**
 * Supabase 連線煙霧測試：用 anon 金鑰讀「已發布作品」，驗證金鑰 + RLS 權限。
 * 用法：set -a && . ./.env && set +a && tsx scripts/test-supabase.ts
 */
import { createClient } from "@supabase/supabase-js"

async function main() {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const works = await supa
    .from("works")
    .select("slug,title,category_group", { count: "exact" })
    .order("sort")

  const designers = await supa.from("designers").select("name", { count: "exact" })

  console.log("作品 works:", works.error ? `❌ ${works.error.message}` : `✅ ${works.count} 筆`)
  if (works.data) works.data.slice(0, 3).forEach((w) => console.log("   -", w.title))
  console.log(
    "設計師 designers:",
    designers.error ? `❌ ${designers.error.message}` : `✅ ${designers.count} 筆`
  )
}

main()

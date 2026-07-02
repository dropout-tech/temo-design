// 瀏覽器端 Supabase client（給 client component 用）。
// 只帶 anon 金鑰，實際能做什麼由資料庫的 RLS 權限決定。
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

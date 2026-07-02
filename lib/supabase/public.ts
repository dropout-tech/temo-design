// 公開讀取用的 Supabase client（前台網站用）。
// 不帶登入 cookie，一律以 anon 身分讀取 → RLS 只會給「已發布」的內容。
// 用純 supabase-js client，可在 build 期（generateStaticParams）與 ISR 下安全運作。
import { createClient } from "@supabase/supabase-js"

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

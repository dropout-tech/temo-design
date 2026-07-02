// 伺服器端 Supabase client（給 server component / server action / route handler 用）。
// 透過 cookie 帶登入狀態，登入者的操作會以 authenticated 身分執行（RLS 才會放行寫入）。
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 從 Server Component 呼叫時不能寫 cookie，交給 middleware 處理即可，忽略。
          }
        },
      },
    }
  )
}

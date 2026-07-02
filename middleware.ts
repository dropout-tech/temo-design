import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// 只在 /studio 後台路徑刷新登入狀態，不影響前台網站與 Payload /admin。
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/studio/:path*"],
}

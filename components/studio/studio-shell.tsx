"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Users,
  Building2,
  HelpCircle,
  Settings,
  Award,
  Newspaper,
  Calculator,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/studio", label: "總覽", icon: LayoutDashboard, exact: true },
  { href: "/studio/works", label: "作品", icon: FolderKanban },
  { href: "/studio/designers", label: "設計師 / 團隊", icon: Users },
  { href: "/studio/faqs", label: "常見問答", icon: HelpCircle },
  { href: "/studio/quote", label: "報價試算", icon: Calculator },
  { href: "/studio/clients", label: "客戶 Logo", icon: Building2 },
  { href: "/studio/awards", label: "得獎紀錄", icon: Award },
  { href: "/studio/press", label: "媒體報導", icon: Newspaper },
  { href: "/studio/settings", label: "網站設定", icon: Settings },
]

const COMING_SOON: { label: string; icon: typeof Users }[] = []

export function StudioShell({
  email,
  children,
}: {
  email?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/studio/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-temo-black text-temo-white flex flex-col md:flex-row">
      {/* 側邊欄 */}
      <aside className="md:w-60 md:shrink-0 md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col bg-[#141210]">
        <div className="px-5 py-5 md:py-6 flex md:block items-center justify-between w-full">
          <Link href="/studio" className="block">
            <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase">TEMO</p>
            <p className="text-base font-bold text-temo-white tracking-wide">Studio</p>
          </Link>
          {/* 手機版登出 */}
          <button
            onClick={logout}
            className="md:hidden text-temo-warm-gray/60 hover:text-temo-gold transition-colors"
            aria-label="登出"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="hidden md:flex md:flex-col md:flex-1 px-3 gap-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-temo-gold/12 text-temo-gold"
                    : "text-temo-warm-gray/70 hover:text-temo-white hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {COMING_SOON.length > 0 && (
            <>
              <p className="px-3 mt-6 mb-2 text-[10px] tracking-[0.25em] text-temo-warm-gray/30 uppercase">
                即將加入
              </p>
              {COMING_SOON.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-temo-warm-gray/25 cursor-not-allowed"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              ))}
            </>
          )}
        </nav>

        {/* 桌機版底部：帳號 + 登出 */}
        <div className="hidden md:block px-3 py-4 border-t border-white/10">
          <p className="px-3 text-[11px] text-temo-warm-gray/50 truncate mb-2" title={email}>
            {email}
          </p>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-temo-warm-gray/70 hover:text-temo-gold hover:bg-white/[0.04] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      </aside>

      {/* 主內容 */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

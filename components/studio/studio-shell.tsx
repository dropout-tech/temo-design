"use client"

import { useEffect, useMemo, useState } from "react"
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
  Tags,
  Menu,
  ClipboardList,
  Presentation,
  ExternalLink,
  Handshake,
  Inbox,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  relatedPaths?: string[]
}

function navItemIsActive(pathname: string, item: NavItem) {
  const primaryMatch = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return primaryMatch || item.relatedPaths?.some((path) => pathname.startsWith(path)) === true
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "工作台",
    items: [
      { href: "/studio", label: "總覽", icon: LayoutDashboard, exact: true },
      { href: "/studio/submissions", label: "表單收件匣", icon: Inbox },
    ],
  },
  {
    label: "內容管理",
    items: [
      { href: "/studio/works", label: "作品", icon: FolderKanban },
      {
        href: "/studio/clients",
        label: "客戶資料",
        icon: Building2,
        relatedPaths: ["/studio/client-logos"],
      },
      { href: "/studio/categories", label: "作品分類", icon: Tags },
      { href: "/studio/landings", label: "服務落地頁", icon: Presentation },
      { href: "/studio/designers", label: "團隊成員", icon: Users },
      { href: "/studio/collaborators", label: "合作夥伴", icon: Handshake },
      { href: "/studio/faqs", label: "常見問答", icon: HelpCircle },
    ],
  },
  {
    label: "報價流程",
    items: [
      { href: "/studio/quote", label: "報價試算", icon: Calculator },
      { href: "/studio/brief", label: "報價問卷", icon: ClipboardList },
    ],
  },
  {
    label: "網站結構",
    items: [
      { href: "/studio/navigation", label: "選單 / 頁尾", icon: Menu },
      { href: "/studio/awards", label: "得獎紀錄", icon: Award },
      { href: "/studio/press", label: "媒體報導", icon: Newspaper },
      { href: "/studio/settings", label: "網站設定", icon: Settings },
    ],
  },
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeLabel = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const match = group.items.find((item) => navItemIsActive(pathname, item))
      if (match) return match.label
    }
    return "後台"
  }, [pathname])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMobileOpen(false))
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/studio/login")
    router.refresh()
  }

  const renderNav = (mobile = false) => (
    <nav className={cn(mobile ? "space-y-5" : "hidden md:flex md:flex-col md:flex-1 px-3 gap-5")}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 mb-1 text-[10px] tracking-[0.22em] text-temo-warm-gray/35 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = navItemIsActive(pathname, item)
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
        </div>
      ))}

      {COMING_SOON.length > 0 && (
        <div className="space-y-1">
          <p className="px-3 mb-1 text-[10px] tracking-[0.22em] text-temo-warm-gray/30 uppercase">
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
        </div>
      )}
    </nav>
  )

  return (
    <div className="min-h-screen bg-temo-black text-temo-white flex flex-col md:flex-row">
      {/* 側邊欄 */}
      <aside className="md:w-64 md:shrink-0 md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 flex flex-wrap md:flex-col bg-[#141210] md:sticky md:top-0">
        <div className="px-5 py-5 md:py-6 flex md:block items-center justify-between w-full">
          <Link href="/studio" className="block">
            <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase">TEMO</p>
            <p className="text-base font-bold text-temo-white tracking-wide">Studio</p>
            <p className="md:hidden mt-0.5 text-[11px] text-temo-warm-gray/45">{activeLabel}</p>
          </Link>
          <div className="md:hidden flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-temo-warm-gray/70 hover:text-temo-gold hover:border-temo-gold/40 transition-colors"
              aria-label="開啟前台"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-temo-warm-gray/70 hover:text-temo-gold hover:border-temo-gold/40 transition-colors"
              aria-label={mobileOpen ? "關閉後台選單" : "開啟後台選單"}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-temo-warm-gray/70 hover:text-temo-gold hover:border-temo-gold/40 transition-colors"
              aria-label="登出"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {renderNav(false)}

        {mobileOpen && (
          <div className="md:hidden w-full px-3 pb-4 max-h-[calc(100svh-86px)] overflow-y-auto">
            {renderNav(true)}
          </div>
        )}

        {/* 桌機版底部：帳號 + 登出 */}
        <div className="hidden md:block px-3 py-4 border-t border-white/10">
          <p className="px-3 text-[11px] text-temo-warm-gray/50 truncate mb-2" title={email}>
            {email}
          </p>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-temo-warm-gray/70 hover:text-temo-gold hover:bg-white/[0.04] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            查看前台
          </a>
          <button
            type="button"
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

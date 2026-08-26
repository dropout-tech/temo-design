import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calculator,
  ClipboardList,
  FolderKanban,
  HelpCircle,
  ImageOff,
  LayoutList,
  Settings,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type WorkSummary = {
  id: string
  slug: string
  title: string
  year: string | null
  cover_url: string | null
  published: boolean
  sort: number
  category_groups: { label: string } | null
  work_category_groups?: {
    sort: number
    category_groups: { label: string } | null
  }[]
  clients: { name: string } | null
}

function categoryLabels(work: WorkSummary): string[] {
  const labels = (work.work_category_groups ?? [])
    .slice()
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((relation) => relation.category_groups?.label)
    .filter((label): label is string => Boolean(label))
  if (labels.length > 0) return labels
  return work.category_groups?.label ? [work.category_groups.label] : []
}

async function getDashboardData() {
  const supabase = await createClient()
  const worksRes = await supabase
    .from("works")
    .select("id, slug, title, year, cover_url, published, sort, category_groups:category_groups!works_category_group_fkey(label), work_category_groups(sort, category_groups(label)), clients(name)")
    .order("sort")
  let works = (worksRes.data ?? []) as unknown as WorkSummary[]
  if (worksRes.error) {
    const fallbackWorks = await supabase
      .from("works")
      .select("id, slug, title, year, cover_url, published, sort, category_groups:category_groups!works_category_group_fkey(label), clients(name)")
      .order("sort")
    works = (fallbackWorks.data ?? []) as unknown as WorkSummary[]
  }

  const [designers, clients, faqs, quoteCategories] = await Promise.all([
    supabase.from("designers").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("faqs").select("*", { count: "exact", head: true }),
    supabase.from("quote_categories").select("*", { count: "exact", head: true }),
  ])
  return {
    works,
    designers: designers.count ?? 0,
    clients: clients.count ?? 0,
    faqs: faqs.count ?? 0,
    quoteCategories: quoteCategories.count ?? 0,
  }
}

export default async function StudioDashboard() {
  const data = await getDashboardData()
  const works = data.works
  const draftWorks = works.filter((w) => !w.published)
  const missingCover = works.filter((w) => !w.cover_url)
  const recentWorks = works.slice(0, 5)

  const stats = [
    { label: "作品", value: works.length, helper: `${draftWorks.length} 件草稿`, icon: FolderKanban, href: "/studio/works" },
    { label: "團隊成員", value: data.designers, helper: "關於頁團隊", icon: Users, href: "/studio/designers" },
    { label: "客戶資料", value: data.clients, helper: "作品關聯主檔", icon: Building2, href: "/studio/clients" },
    { label: "FAQ", value: data.faqs, helper: "常見問答", icon: HelpCircle, href: "/studio/faqs" },
  ]
  const quickActions = [
    { label: "新增作品", href: "/studio/works/new", icon: FolderKanban },
    { label: "管理報價", href: "/studio/quote", icon: Calculator },
    { label: "編輯問卷", href: "/studio/brief", icon: ClipboardList },
    { label: "網站設定", href: "/studio/settings", icon: Settings },
  ]

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl">
      <div className="mb-9">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white mb-2">內容工作台</h1>
        <p className="text-temo-warm-gray/70 max-w-2xl">
          先看需要處理的內容，再進入各管理頁細修。這裡不取代任何功能，只把常見工作放到前面。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const card = (
            <div className="h-full rounded-lg border border-white/10 bg-white/[0.025] p-5 hover:border-temo-gold/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <s.icon className="w-5 h-5 text-temo-gold" />
                <ArrowUpRight className="w-4 h-4 text-temo-warm-gray/35" />
              </div>
              <p className="text-4xl font-bold text-temo-white">{s.value}</p>
              <p className="text-sm text-temo-warm-gray/60 mt-1">{s.label}</p>
              <p className="text-[11px] text-temo-warm-gray/35 mt-2">{s.helper}</p>
            </div>
          )
          return (
            <Link key={s.label} href={s.href} className="group">
              {card}
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.75fr)] gap-6">
        <section className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-temo-white tracking-wide">最近作品</h2>
              <p className="text-xs text-temo-warm-gray/45 mt-1">快速回到最常調整的內容。</p>
            </div>
            <Link
              href="/studio/works"
              className="inline-flex items-center gap-1.5 text-xs text-temo-gold hover:brightness-125 transition"
            >
              管理全部 <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {recentWorks.map((w) => (
              <div key={w.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 overflow-hidden shrink-0">
                  {w.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-temo-warm-gray/30">
                      <ImageOff className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-temo-white truncate">{w.title}</p>
                  <p className="text-[11px] text-temo-warm-gray/45 truncate">
                    {[categoryLabels(w).join("、"), w.clients?.name, w.year].filter(Boolean).join(" · ") || "尚未補分類資訊"}
                  </p>
                </div>
                {!w.published && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.06] text-temo-warm-gray/60 shrink-0">
                    草稿
                  </span>
                )}
                <Link
                  href={`/studio/works/${w.id}`}
                  className="text-xs text-temo-warm-gray/60 hover:text-temo-gold transition-colors shrink-0"
                >
                  編輯
                </Link>
              </div>
            ))}
            {recentWorks.length === 0 && (
              <p className="px-5 py-8 text-sm text-temo-warm-gray/50 text-center">還沒有作品資料。</p>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-temo-gold" />
              <h2 className="text-sm font-bold text-temo-white tracking-wide">需要注意</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/studio/works"
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 text-sm hover:border-temo-gold/35 transition-colors"
              >
                <span className="text-temo-warm-gray/75">草稿作品</span>
                <span className="text-temo-white font-semibold">{draftWorks.length}</span>
              </Link>
              <Link
                href="/studio/works"
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 text-sm hover:border-temo-gold/35 transition-colors"
              >
                <span className="text-temo-warm-gray/75">缺封面作品</span>
                <span className="text-temo-white font-semibold">{missingCover.length}</span>
              </Link>
              <Link
                href="/studio/quote"
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 text-sm hover:border-temo-gold/35 transition-colors"
              >
                <span className="text-temo-warm-gray/75">報價類別</span>
                <span className="text-temo-white font-semibold">{data.quoteCategories}</span>
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <LayoutList className="w-4 h-4 text-temo-gold" />
              <h2 className="text-sm font-bold text-temo-white tracking-wide">常用操作</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="min-h-24 rounded-md border border-white/10 bg-white/[0.02] p-3 hover:border-temo-gold/35 hover:bg-temo-gold/[0.04] transition-colors"
                >
                  <action.icon className="w-4 h-4 text-temo-gold mb-6" />
                  <span className="text-sm text-temo-white">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

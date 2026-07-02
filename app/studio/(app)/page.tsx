import Link from "next/link"
import { ArrowUpRight, FolderKanban, Users, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function getCounts() {
  const supabase = await createClient()
  const [works, designers, clients] = await Promise.all([
    supabase.from("works").select("*", { count: "exact", head: true }),
    supabase.from("designers").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
  ])
  return {
    works: works.count ?? 0,
    designers: designers.count ?? 0,
    clients: clients.count ?? 0,
  }
}

export default async function StudioDashboard() {
  const counts = await getCounts()

  const stats = [
    { label: "作品", value: counts.works, icon: FolderKanban, href: "/studio/works" },
    { label: "設計師 / 團隊", value: counts.designers, icon: Users, href: null },
    { label: "客戶", value: counts.clients, icon: Building2, href: null },
  ]

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-5xl">
      <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Dashboard</p>
      <h1 className="text-3xl md:text-4xl font-bold text-temo-white mb-2">歡迎回來</h1>
      <p className="text-temo-warm-gray/70 mb-10">這是你自己的內容管理後台。</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const card = (
            <div className="h-full rounded-xl border border-white/10 bg-[#201d1a] p-6 hover:border-temo-gold/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <s.icon className="w-5 h-5 text-temo-gold" />
                {s.href && (
                  <ArrowUpRight className="w-4 h-4 text-temo-warm-gray/40" />
                )}
              </div>
              <p className="text-4xl font-bold text-temo-white">{s.value}</p>
              <p className="text-sm text-temo-warm-gray/60 mt-1">{s.label}</p>
            </div>
          )
          return s.href ? (
            <Link key={s.label} href={s.href} className="group">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          )
        })}
      </div>

      <Link
        href="/studio/works"
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 transition-all rounded-sm"
      >
        管理作品
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

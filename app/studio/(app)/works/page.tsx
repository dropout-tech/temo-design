import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "作品管理 — TEMO Studio" }

type WorkRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_url: string | null
  year: string | null
  published: boolean
  sort: number
  category_groups: { label: string } | null
  clients: { name: string } | null
}

async function getWorks(): Promise<WorkRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("works")
    .select(
      "id, slug, title, subtitle, cover_url, year, published, sort, category_groups(label), clients(name)"
    )
    .order("sort")
  return (data as unknown as WorkRow[]) ?? []
}

export default async function StudioWorksPage() {
  const works = await getWorks()

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-5xl">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Portfolio</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">作品管理</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">共 {works.length} 件作品</p>
        </div>
        <Link
          href="/studio/works/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          新增作品
        </Link>
      </div>

      <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {works.map((w) => (
          <div key={w.id} className="flex items-center gap-4 py-3.5">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
              {w.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.cover_url}
                  alt={w.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-temo-white font-medium truncate">{w.title}</p>
                {!w.published && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-temo-warm-gray/60 shrink-0">
                    未上架
                  </span>
                )}
              </div>
              <p className="text-xs text-temo-warm-gray/50 truncate">
                {[w.category_groups?.label, w.clients?.name, w.year]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Link
              href={`/studio/works/${w.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-temo-warm-gray/70 hover:text-temo-gold border border-white/10 hover:border-temo-gold/40 rounded-sm shrink-0 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              編輯
            </Link>
          </div>
        ))}
      </div>

      {works.length === 0 && (
        <p className="text-temo-warm-gray/50 text-sm py-10 text-center">
          還沒有作品資料。
        </p>
      )}
    </div>
  )
}

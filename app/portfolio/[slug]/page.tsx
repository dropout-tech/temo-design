import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PortfolioDetailClient, type DetailProject } from "@/components/pages/portfolio-detail-client"
import { getAllPortfolioSlugs, getPortfolioBySlug } from "@/lib/payload"
import {
  CLIENT_MAP,
  DESIGNER_MAP,
  WORKS,
  getCategoryLabel,
  getRelatedWorks,
  getSubTagLabel,
  getWorkBySlug,
} from "@/lib/portfolio-data"

interface PortfolioDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 60

function buildFromLocal(slug: string): DetailProject | null {
  const work = getWorkBySlug(slug)
  if (!work) return null
  const client = CLIENT_MAP[work.clientSlug]
  const designers = work.designerSlugs
    .map((s) => DESIGNER_MAP[s])
    .filter(Boolean)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      nameZh: d.nameZh,
      role: d.role,
      photo: d.photo,
    }))
  const related = getRelatedWorks(slug, 3).map((w) => ({
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle,
    cover: w.cover,
    categoryLabel: getCategoryLabel(w.categoryGroup),
    year: w.year,
  }))

  return {
    slug: work.slug,
    title: work.title,
    subtitle: work.subtitle,
    categoryLabel: getCategoryLabel(work.categoryGroup),
    categoryGroup: work.categoryGroup,
    subTagLabels: work.subTags.map((t) => getSubTagLabel(work.categoryGroup, t)),
    subTags: work.subTags.map((t) => ({
      value: t,
      label: getSubTagLabel(work.categoryGroup, t),
    })),
    year: work.year,
    clientName: client?.name,
    clientSlug: client?.slug,
    clientBrief: client?.brief,
    description: work.description,
    cover: work.cover,
    services: work.services,
    deliverables: work.deliverables,
    challenge: work.challenge,
    approach: work.approach,
    result: work.result,
    gallery: work.gallery,
    quote: work.quote,
    awards: work.awards,
    designers,
    related,
  }
}

async function loadProject(slug: string): Promise<DetailProject | null> {
  // 優先讀 CMS；CMS 沒設定或查無此 slug 時，fallback 到本地 WORKS。
  const doc = await getPortfolioBySlug(slug)
  if (doc) {
    const fromLocal = buildFromLocal(slug)
    return {
      slug,
      title: doc.title,
      subtitle: doc.subtitle ?? fromLocal?.subtitle ?? "",
      categoryLabel: doc.category,
      categoryGroup: fromLocal?.categoryGroup,
      subTagLabels: (doc.tags ?? []).map((t) => t.tag),
      subTags: fromLocal?.subTags,
      year: doc.year,
      clientName: doc.client ?? fromLocal?.clientName,
      clientSlug: fromLocal?.clientSlug,
      clientBrief: fromLocal?.clientBrief,
      description: doc.description,
      cover:
        typeof doc.cover === "object" && doc.cover?.url
          ? doc.cover.url
          : doc.coverUrl ?? fromLocal?.cover ?? "/placeholder.jpg",
      services: fromLocal?.services,
      deliverables: fromLocal?.deliverables,
      challenge: fromLocal?.challenge,
      approach: doc.content ?? fromLocal?.approach,
      result: fromLocal?.result,
      gallery: fromLocal?.gallery,
      quote: fromLocal?.quote,
      awards: fromLocal?.awards,
      designers: fromLocal?.designers ?? [],
      related: fromLocal?.related ?? [],
    }
  }
  return buildFromLocal(slug)
}

export async function generateMetadata(
  props: PortfolioDetailPageProps
): Promise<Metadata> {
  const params = await props.params
  const project = await loadProject(params.slug)

  return {
    title: `${project?.title || "案例"} | TEMO DESIGN`,
    description: project?.description || "",
  }
}

export async function generateStaticParams() {
  const cmsSlugs = await getAllPortfolioSlugs()
  if (cmsSlugs && cmsSlugs.length > 0) {
    return cmsSlugs.map((slug) => ({ slug }))
  }
  return WORKS.map((w) => ({ slug: w.slug }))
}

export default async function PortfolioDetailPage(
  props: PortfolioDetailPageProps
) {
  const params = await props.params
  const project = await loadProject(params.slug)

  if (!project) {
    notFound()
  }

  return <PortfolioDetailClient project={project} />
}

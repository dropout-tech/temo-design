import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { PortfolioDetailClient, type DetailProject } from "@/components/pages/portfolio-detail-client"
import { getWorkDetail, getPublishedWorkSlugs } from "@/lib/portfolio-supabase"
import { decodeWorkSlugParam, normalizeWorkSlug } from "@/lib/work-slug"
import {
  CLIENT_MAP,
  DESIGNER_MAP,
  WORKS,
  getCategoryLabel,
  getIndustryLabel,
  getRelatedWorks,
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
      category: "DESIGNER 設計團隊",
    }))
  const related = getRelatedWorks(slug, 3).map((w) => ({
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle,
    cover: w.cover,
    categoryLabel: getCategoryLabel(w.categoryGroup),
    year: w.year,
  }))
  const categoryGroups = (work.categoryGroups?.length ? work.categoryGroups : [work.categoryGroup]).map(
    (value) => ({ value, label: getCategoryLabel(value as never) })
  )

  return {
    slug: work.slug,
    title: work.title,
    subtitle: work.subtitle,
    categoryLabel: categoryGroups.map((group) => group.label).join("、"),
    categoryGroup: categoryGroups[0]?.value,
    categoryGroups,
    industryLabels: work.industries.map((i) => getIndustryLabel(i)),
    industries: work.industries.map((i) => ({
      value: i,
      label: getIndustryLabel(i),
    })),
    year: work.year,
    clientName: client?.name,
    clientSlug: client?.slug,
    clientBrief: client?.brief,
    clientAddress: client?.address,
    clientPhone: client?.phone,
    clientWebsite: client?.website,
    description: work.description,
    cover: work.cover,
    videoUrl: work.videoUrl,
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
  // 優先讀 Supabase；查無此 slug（或連線異常）時 fallback 到本地 WORKS。
  const fromSupabase = await getWorkDetail(slug)
  if (fromSupabase) return fromSupabase
  return buildFromLocal(slug)
}

type ProjectResolution = {
  project: DetailProject | null
  canonicalSlug?: string
}

async function resolveProject(rawSlug: string): Promise<ProjectResolution> {
  const decodedSlug = decodeWorkSlugParam(rawSlug)
  const exactProject = await loadProject(decodedSlug)
  if (exactProject) return { project: exactProject }

  const normalizedSlug = normalizeWorkSlug(decodedSlug)
  if (!normalizedSlug || normalizedSlug === decodedSlug) {
    return { project: null }
  }

  const canonicalProject = await loadProject(normalizedSlug)
  if (!canonicalProject) return { project: null }

  return {
    project: canonicalProject,
    canonicalSlug: canonicalProject.slug,
  }
}

export async function generateMetadata(
  props: PortfolioDetailPageProps
): Promise<Metadata> {
  const params = await props.params
  const { project } = await resolveProject(params.slug)

  return {
    title: `${project?.title || "案例"} | TEMO DESIGN`,
    description: project?.description || "",
  }
}

export async function generateStaticParams() {
  const slugs = await getPublishedWorkSlugs()
  if (slugs.length > 0) return slugs.map((slug) => ({ slug }))
  return WORKS.map((w) => ({ slug: w.slug }))
}

export default async function PortfolioDetailPage(
  props: PortfolioDetailPageProps
) {
  const params = await props.params
  const { project, canonicalSlug } = await resolveProject(params.slug)

  if (canonicalSlug) {
    permanentRedirect(`/portfolio/${encodeURIComponent(canonicalSlug)}`)
  }

  if (!project) {
    notFound()
  }

  return <PortfolioDetailClient project={project} />
}

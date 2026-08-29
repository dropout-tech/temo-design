import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryLandingClient } from "@/components/pages/category-landing-client"
import { CATEGORY_LANDINGS, CATEGORY_LANDING_MAP } from "@/lib/category-landing-data"
import {
  getCategoryLanding,
  getCategoryLandings,
  getCategoryGroups,
  getSiteSettings,
} from "@/lib/content-supabase"
import { getAllWorks } from "@/lib/portfolio-supabase"

interface ServiceLandingPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export const revalidate = 60

export async function generateStaticParams() {
  const landings = await getCategoryLandings()
  const list = landings.length > 0 ? landings : CATEGORY_LANDINGS
  return list.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata(props: ServiceLandingPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const landing = (await getCategoryLanding(slug)) ?? CATEGORY_LANDING_MAP[slug]
  if (!landing) return { title: "服務 | TEMO DESIGN" }
  return {
    title: `${landing.titleEn.join(" ")} | TEMO DESIGN`,
    description: landing.taglineZh.replace(/\n/g, " "),
  }
}

export default async function ServiceLandingPage(props: ServiceLandingPageProps) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams])
  const landing = (await getCategoryLanding(slug)) ?? CATEGORY_LANDING_MAP[slug]
  if (!landing) notFound()
  const [works, allGroups, settings] = await Promise.all([
    getAllWorks(),
    getCategoryGroups(),
    getSiteSettings(),
  ])
  // 只顯示歸屬本落地頁的執行項目作品；migration 0018 未套用（歸屬全空）時照舊顯示全部
  const ownGroups = allGroups.filter((g) => g.landingSlug === slug)
  return (
    <CategoryLandingClient
      landing={landing}
      works={works}
      categoryGroups={ownGroups.length > 0 ? ownGroups : undefined}
      allowedGroups={ownGroups.length > 0 ? ownGroups.map((g) => g.value) : undefined}
      portfolioFilterLanguage={settings?.portfolio_filter_language ?? "en"}
      initialFilterParams={{
        group: firstParam(searchParams.group),
        industry: firstParam(searchParams.industry),
        client: firstParam(searchParams.client),
        designer: firstParam(searchParams.designer),
        year: firstParam(searchParams.year),
        query: firstParam(searchParams.q),
      }}
    />
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryLandingClient } from "@/components/pages/category-landing-client"
import { CATEGORY_LANDINGS, CATEGORY_LANDING_MAP } from "@/lib/category-landing-data"
import { getCategoryLanding, getCategoryLandings } from "@/lib/content-supabase"
import { getAllWorks } from "@/lib/portfolio-supabase"

interface ServiceLandingPageProps {
  params: Promise<{ slug: string }>
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
  const { slug } = await props.params
  const landing = (await getCategoryLanding(slug)) ?? CATEGORY_LANDING_MAP[slug]
  if (!landing) notFound()
  const works = await getAllWorks()
  return <CategoryLandingClient landing={landing} works={works} />
}

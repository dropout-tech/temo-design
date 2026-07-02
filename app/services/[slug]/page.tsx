import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryLandingClient } from "@/components/pages/category-landing-client"
import { CATEGORY_LANDINGS, CATEGORY_LANDING_MAP } from "@/lib/category-landing-data"
import { getAllWorks } from "@/lib/portfolio-supabase"

interface ServiceLandingPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export function generateStaticParams() {
  return CATEGORY_LANDINGS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata(props: ServiceLandingPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const landing = CATEGORY_LANDING_MAP[slug]
  if (!landing) return { title: "服務 | TEMO DESIGN" }
  return {
    title: `${landing.titleEn.join(" ")} | TEMO DESIGN`,
    description: landing.taglineZh.replace(/\n/g, " "),
  }
}

export default async function ServiceLandingPage(props: ServiceLandingPageProps) {
  const { slug } = await props.params
  const landing = CATEGORY_LANDING_MAP[slug]
  if (!landing) notFound()
  const works = await getAllWorks()
  return <CategoryLandingClient landing={landing} works={works} />
}

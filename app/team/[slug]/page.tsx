import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TeamMemberClient } from "@/components/pages/team-member-client"
import {
  getDesignerBySlug,
  getDesignerSlugs,
  getWorksByDesignerSlug,
} from "@/lib/portfolio-supabase"
import { getCategoryGroups } from "@/lib/content-supabase"

interface TeamMemberPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateMetadata(props: TeamMemberPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const designer = await getDesignerBySlug(slug)
  if (!designer) return { title: "設計師 | TEMO DESIGN" }
  return {
    title: `${designer.name} ${designer.nameZh ? `/ ${designer.nameZh}` : ""} | TEMO DESIGN`,
    description: designer.bio[0] ?? "",
  }
}

export async function generateStaticParams() {
  const slugs = await getDesignerSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function TeamMemberPage(props: TeamMemberPageProps) {
  const { slug } = await props.params
  const designer = await getDesignerBySlug(slug)
  if (!designer) notFound()

  const [works, categoryGroups] = await Promise.all([
    getWorksByDesignerSlug(slug),
    getCategoryGroups(),
  ])
  return <TeamMemberClient designer={designer} works={works} categoryGroups={categoryGroups} />
}

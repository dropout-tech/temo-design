import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TeamMemberClient } from "@/components/pages/team-member-client"
import { DESIGNER_MAP, DESIGNERS, getWorksByDesigner } from "@/lib/portfolio-data"

interface TeamMemberPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: TeamMemberPageProps): Promise<Metadata> {
  const { slug } = await props.params
  const designer = DESIGNER_MAP[slug]
  if (!designer) return { title: "設計師 | TEMO DESIGN" }
  return {
    title: `${designer.name} ${designer.nameZh ? `/ ${designer.nameZh}` : ""} | TEMO DESIGN`,
    description: designer.bio[0] ?? "",
  }
}

export function generateStaticParams() {
  return DESIGNERS.map((d) => ({ slug: d.slug }))
}

export default async function TeamMemberPage(props: TeamMemberPageProps) {
  const { slug } = await props.params
  const designer = DESIGNER_MAP[slug]
  if (!designer) notFound()

  const works = getWorksByDesigner(slug)
  return <TeamMemberClient designer={designer} works={works} />
}

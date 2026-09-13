import { notFound } from "next/navigation"
import PortfolioDetailPage, { generateMetadata as workMetadata } from "@/components/pages/portfolio-detail-server"
import { getLegacyWorkSlug, LEGACY_WORK_PATHS } from "@/lib/legacy-work-paths"

export const revalidate = 60
type Props = { params: Promise<{ legacySlug: string }> }
export function generateStaticParams() {
  return Object.keys(LEGACY_WORK_PATHS).map((legacySlug) => ({ legacySlug }))
}
async function workProps({ params }: Props) {
  const { legacySlug } = await params
  const slug = getLegacyWorkSlug(legacySlug)
  if (!slug) notFound()
  return { params: Promise.resolve({ slug }), preserveLegacyPath: true }
}
export async function generateMetadata(props: Props) {
  return workMetadata(await workProps(props))
}
/** 舊路徑直接回傳作品 HTML，不轉址、不改作品資料與版型。 */
export default async function LegacyWorkPage(props: Props) {
  return PortfolioDetailPage(await workProps(props))
}

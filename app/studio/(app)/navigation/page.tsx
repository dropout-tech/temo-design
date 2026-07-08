import { NavigationManager } from "@/components/studio/navigation-manager"
import { getNavLinks } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "選單 / 頁尾 — TEMO Studio" }

export default async function StudioNavigationPage() {
  const links = await getNavLinks()

  return <NavigationManager links={links} />
}

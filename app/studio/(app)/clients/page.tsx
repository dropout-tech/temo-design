import { ClientLogoManager } from "@/components/studio/client-logo-manager"
import { getClientLogos } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "客戶 Logo — TEMO Studio" }

export default async function StudioClientsPage() {
  const items = await getClientLogos()
  return (
    <ClientLogoManager
      initial={items.map((c) => ({
        key: c.id,
        id: c.id,
        name: c.name,
        image_url: c.image_url,
        sort: c.sort,
      }))}
    />
  )
}

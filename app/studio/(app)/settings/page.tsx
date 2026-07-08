import { SettingsForm } from "@/components/studio/settings-form"
import { getSiteSettings } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "網站設定 — TEMO Studio" }

export default async function StudioSettingsPage() {
  const s = await getSiteSettings()
  return (
    <SettingsForm
      initial={{
        name: s?.name ?? "",
        description: s?.description ?? "",
        email: s?.email ?? "",
        phone: s?.phone ?? "",
        address: s?.address ?? "",
        instagram: s?.instagram ?? "",
        facebook: s?.facebook ?? "",
        behance: s?.behance ?? "",
        business_hours: s?.business_hours ?? "",
        line_url: s?.line_url ?? "",
        line_qr_url: s?.line_qr_url ?? "",
      }}
    />
  )
}

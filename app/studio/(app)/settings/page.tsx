import { SettingsForm } from "@/components/studio/settings-form"
import { SocialLinksManager } from "@/components/studio/social-links-manager"
import { getSiteSettings } from "@/lib/content-supabase"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "網站設定 — TEMO Studio" }

async function getSocialLinks() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("social_links")
      .select("id, platform, href, visible, sort")
      .order("sort")
    if (error) return []
    return (data ?? []).map((r) => ({
      id: r.id as string,
      platform: r.platform as string,
      href: (r.href as string | null) ?? "",
      visible: r.visible as boolean,
      sort: r.sort as number,
    }))
  } catch {
    // migration 0013 尚未套用時，表不存在，容錯回空陣列
    return []
  }
}

export default async function StudioSettingsPage() {
  const [s, socialLinks] = await Promise.all([getSiteSettings(), getSocialLinks()])
  return (
    <>
      <SettingsForm
        initial={{
          name: s?.name ?? "",
          description: s?.description ?? "",
          email: s?.email ?? "",
          phone: s?.phone ?? "",
          address: s?.address ?? "",
          business_hours: s?.business_hours ?? "",
          line_url: s?.line_url ?? "",
          line_qr_url: s?.line_qr_url ?? "",
        }}
      />
      <SocialLinksManager rows={socialLinks} />
    </>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudioShell } from "@/components/studio/studio-shell"

export const metadata = { title: "TEMO Studio 後台" }

// 登入守衛：沒登入一律導去 /studio/login。
export default async function StudioAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/studio/login")
  }

  return <StudioShell email={user.email}>{children}</StudioShell>
}

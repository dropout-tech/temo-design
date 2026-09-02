"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  COLLABORATOR_NAME_MAX,
  collaboratorNameKey,
  normalizeCollaboratorName,
  normalizeCollaboratorNames,
  replaceCollaboratorName,
  type TemporaryNameKind,
} from "@/lib/collaborator-names"
import {
  mergeGuestDesignerCredits,
  renameGuestDesignerCredits,
  type GuestDesignerCredit,
} from "@/lib/work-team-credits"

type WorkCollaboratorRow = {
  id: string
  slug: string
  guest_designer_names: unknown
  guest_designer_credits: unknown
  collaborator_names: unknown
}

type UpdatedWork = {
  id: string
  slug: string
  before: string[]
  beforeCredits?: GuestDesignerCredit[]
}

export async function renameCollaborator(
  kind: TemporaryNameKind,
  sourceName: string,
  nextNameInput: string
): Promise<{ error?: string; updatedWorks?: number }> {
  if (kind !== "guest-designer" && kind !== "collaborator") {
    return { error: "找不到要整理的名稱類型" }
  }
  const column = kind === "guest-designer" ? "guest_designer_names" : "collaborator_names"
  const label = kind === "guest-designer" ? "臨時設計師" : "合作夥伴"
  const sourceKey = collaboratorNameKey(sourceName)
  const nextName = normalizeCollaboratorName(nextNameInput)

  if (!sourceKey) return { error: `找不到要整理的${label}名稱` }
  if (!nextName) return { error: `請輸入新的${label}名稱` }
  if (nextName.length > COLLABORATOR_NAME_MAX) {
    return { error: `${label}名稱請控制在 ${COLLABORATOR_NAME_MAX} 個字內` }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("works")
    .select("id, slug, guest_designer_names, collaborator_names")

  if (error) return { error: error.message }

  let creditsAvailable = false
  const creditsByWork = new Map<string, unknown>()
  if (kind === "guest-designer") {
    const { data: creditRows, error: creditError } = await supabase
      .from("works")
      .select("id, guest_designer_credits")
    if (!creditError && Array.isArray(creditRows)) {
      creditsAvailable = true
      for (const row of creditRows) {
        creditsByWork.set(row.id, row.guest_designer_credits)
      }
    }
  }

  const affected = ((data ?? []) as unknown as WorkCollaboratorRow[])
    .map((work) => {
      const before = normalizeCollaboratorNames(work[column])
      if (!before.some((name) => collaboratorNameKey(name) === sourceKey)) return null

      const after = replaceCollaboratorName(before, sourceName, nextName)
      return {
        ...work,
        guest_designer_credits: creditsByWork.get(work.id),
        before,
        after,
      }
    })
    .filter((work): work is WorkCollaboratorRow & { before: string[]; after: string[] } => Boolean(work))

  if (affected.length === 0) {
    return { error: `這個${label}名稱已不在任何作品中，請更新頁面後再試一次` }
  }

  const completed: UpdatedWork[] = []
  for (const work of affected) {
    const beforeCredits =
      kind === "guest-designer" && creditsAvailable
        ? mergeGuestDesignerCredits(work.guest_designer_credits, work.before)
        : undefined
    const update =
      kind === "guest-designer" && creditsAvailable
        ? {
            [column]: work.after,
            guest_designer_credits: renameGuestDesignerCredits(
              beforeCredits,
              sourceName,
              nextName
            ),
          }
        : { [column]: work.after }
    const { error: updateError } = await supabase
      .from("works")
      .update(update)
      .eq("id", work.id)

    if (updateError) {
      await Promise.all(
        completed.map((saved) =>
          supabase
            .from("works")
            .update(
              kind === "guest-designer" && creditsAvailable
                ? {
                    [column]: saved.before,
                    guest_designer_credits: saved.beforeCredits ?? [],
                  }
                : { [column]: saved.before }
            )
            .eq("id", saved.id)
        )
      )
      return { error: `更新失敗，已嘗試還原先前作品：${updateError.message}` }
    }

    completed.push({ id: work.id, slug: work.slug, before: work.before, beforeCredits })
  }

  revalidatePath("/studio/collaborators")
  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  for (const work of affected) revalidatePath(`/portfolio/${work.slug}`)

  return { updatedWorks: affected.length }
}

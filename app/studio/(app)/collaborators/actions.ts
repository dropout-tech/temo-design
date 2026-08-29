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

type WorkCollaboratorRow = {
  id: string
  slug: string
  guest_designer_names: unknown
  collaborator_names: unknown
}

type UpdatedWork = {
  id: string
  slug: string
  before: string[]
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

  const affected = ((data ?? []) as unknown as WorkCollaboratorRow[])
    .map((work) => {
      const before = normalizeCollaboratorNames(work[column])
      if (!before.some((name) => collaboratorNameKey(name) === sourceKey)) return null

      const after = replaceCollaboratorName(before, sourceName, nextName)
      return { ...work, before, after }
    })
    .filter((work): work is WorkCollaboratorRow & { before: string[]; after: string[] } => Boolean(work))

  if (affected.length === 0) {
    return { error: `這個${label}名稱已不在任何作品中，請更新頁面後再試一次` }
  }

  const completed: UpdatedWork[] = []
  for (const work of affected) {
    const { error: updateError } = await supabase
      .from("works")
      .update({ [column]: work.after })
      .eq("id", work.id)

    if (updateError) {
      await Promise.all(
        completed.map((saved) =>
          supabase
            .from("works")
            .update({ [column]: saved.before })
            .eq("id", saved.id)
        )
      )
      return { error: `更新失敗，已嘗試還原先前作品：${updateError.message}` }
    }

    completed.push({ id: work.id, slug: work.slug, before: work.before })
  }

  revalidatePath("/studio/collaborators")
  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  for (const work of affected) revalidatePath(`/portfolio/${work.slug}`)

  return { updatedWorks: affected.length }
}

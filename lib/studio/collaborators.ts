import { createClient } from "@/lib/supabase/server"
import {
  buildCollaboratorDirectory,
  collaboratorNameKey,
  type CollaboratorDirectoryEntry,
  type CollaboratorSourceWork,
} from "@/lib/collaborator-names"
import { mergeGuestDesignerCredits, mergeCollaboratorCredits } from "@/lib/work-team-credits"

export async function getCollaboratorDirectory(): Promise<{
  entries: CollaboratorDirectoryEntry[]
  error?: string
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("works")
    .select("id, slug, title, published, updated_at, guest_designer_names")
    .order("updated_at", { ascending: false })

  if (error) return { entries: [], error: error.message }

  const { data: collaboratorRows } = await supabase
    .from("works")
    .select("id, collaborator_names")
  const collaboratorsByWork = new Map(
    (collaboratorRows ?? []).map((work) => [work.id, work.collaborator_names])
  )
  const works = (data ?? []).map((work) => ({
    ...work,
    collaborator_names: collaboratorsByWork.get(work.id) ?? [],
  }))

  const [guestCredits, collaboratorCredits] = await Promise.all([
    supabase.from("works").select("id, guest_designer_credits"),
    supabase.from("works").select("id, collaborator_credits"),
  ])
  const guestCreditsByWork = new Map((guestCredits.data ?? []).map((work) => [work.id, work.guest_designer_credits]))
  const collaboratorCreditsByWork = new Map((collaboratorCredits.data ?? []).map((work) => [work.id, work.collaborator_credits]))
  const titles = new Map<string, string>()
  const directoryWorks = works.map((work) => {
    const guests = mergeGuestDesignerCredits(guestCreditsByWork.get(work.id), work.guest_designer_names)
    const collaborators = mergeCollaboratorCredits(collaboratorCreditsByWork.get(work.id), work.collaborator_names)
    for (const credit of guests) titles.set(`${work.id}:guest-designer:${collaboratorNameKey(credit.name)}`, credit.creditTitle)
    for (const credit of collaborators) titles.set(`${work.id}:collaborator:${collaboratorNameKey(credit.name)}`, credit.creditTitle)
    return { ...work, guest_designer_names: guests.map((credit) => credit.name), collaborator_names: collaborators.map((credit) => credit.name) }
  })

  return {
    entries: buildCollaboratorDirectory(
      directoryWorks as unknown as CollaboratorSourceWork[]
    ).map((entry) => ({
      ...entry,
      usages: entry.usages.map((usage) => ({
        ...usage,
        creditTitle: titles.get(`${usage.workId}:${entry.key}`) || undefined,
      })),
    })),
  }
}

import { createClient } from "@/lib/supabase/server"
import {
  buildCollaboratorDirectory,
  type CollaboratorDirectoryEntry,
  type CollaboratorSourceWork,
} from "@/lib/collaborator-names"

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

  return {
    entries: buildCollaboratorDirectory(
      works as unknown as CollaboratorSourceWork[]
    ),
  }
}

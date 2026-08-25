import { CollaboratorManager } from "@/components/studio/collaborator-manager"
import { getCollaboratorDirectory } from "@/lib/studio/collaborators"

export const dynamic = "force-dynamic"
export const metadata = { title: "合作夥伴 — TEMO Studio" }

export default async function StudioCollaboratorsPage() {
  const { entries, error } = await getCollaboratorDirectory()
  return <CollaboratorManager initial={entries} loadError={error} />
}

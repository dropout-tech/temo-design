export const COLLABORATOR_NAME_MAX = 100
export const COLLABORATOR_NAME_LIMIT = 20

export type TemporaryNameKind = "guest-designer" | "collaborator"

export function normalizeCollaboratorName(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ")
}

export function collaboratorNameKey(value: unknown): string {
  return normalizeCollaboratorName(value).toLocaleLowerCase()
}

export function normalizeCollaboratorNames(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const names: string[] = []

  for (const value of values) {
    const name = normalizeCollaboratorName(value)
    const key = collaboratorNameKey(name)
    if (!name || seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }

  return names
}

export function replaceCollaboratorName(
  values: unknown,
  sourceName: string,
  nextName: string
): string[] {
  const sourceKey = collaboratorNameKey(sourceName)
  const normalizedNextName = normalizeCollaboratorName(nextName)
  return normalizeCollaboratorNames(
    normalizeCollaboratorNames(values).map((name) =>
      collaboratorNameKey(name) === sourceKey ? normalizedNextName : name
    )
  )
}

export type CollaboratorSourceWork = {
  id: string
  slug: string
  title: string
  published: boolean
  updated_at?: string | null
  guest_designer_names: unknown
  collaborator_names: unknown
}

export type CollaboratorUsage = {
  workId: string
  slug: string
  title: string
  published: boolean
}

export type CollaboratorDirectoryEntry = {
  key: string
  kind: TemporaryNameKind
  name: string
  variants: string[]
  usages: CollaboratorUsage[]
}

/** 從各作品的臨時設計師與合作夥伴名稱建立名錄；不建立額外人物資料。 */
export function buildCollaboratorDirectory(
  works: CollaboratorSourceWork[]
): CollaboratorDirectoryEntry[] {
  const entries = new Map<
    string,
    CollaboratorDirectoryEntry & { variantSet: Set<string> }
  >()

  function addNames(
    work: CollaboratorSourceWork,
    kind: TemporaryNameKind,
    values: unknown
  ) {
    for (const name of normalizeCollaboratorNames(values)) {
      const nameKey = collaboratorNameKey(name)
      const key = `${kind}:${nameKey}`
      const existing = entries.get(key)
      if (existing) {
        existing.variantSet.add(name)
        existing.usages.push({
          workId: work.id,
          slug: work.slug,
          title: work.title,
          published: work.published,
        })
        continue
      }

      entries.set(key, {
        key,
        kind,
        name,
        variants: [],
        variantSet: new Set([name]),
        usages: [
          {
            workId: work.id,
            slug: work.slug,
            title: work.title,
            published: work.published,
          },
        ],
      })
    }
  }

  for (const work of works) {
    addNames(work, "guest-designer", work.guest_designer_names)
    addNames(work, "collaborator", work.collaborator_names)
  }

  return Array.from(entries.values())
    .map(({ variantSet, ...entry }) => ({
      ...entry,
      variants: Array.from(variantSet),
    }))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "guest-designer" ? -1 : 1
      return a.name.localeCompare(b.name, "zh-Hant")
    })
}

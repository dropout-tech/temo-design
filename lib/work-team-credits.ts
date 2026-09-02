import {
  collaboratorNameKey,
  normalizeCollaboratorName,
  normalizeCollaboratorNames,
} from "@/lib/collaborator-names"

export const WORK_CREDIT_TITLE_MAX = 100

export type GuestDesignerCredit = {
  name: string
  creditTitle: string
}

export function normalizeWorkCreditTitle(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ")
}

export function normalizeGuestDesignerCredits(value: unknown): GuestDesignerCredit[] {
  if (!Array.isArray(value)) return []

  const credits: GuestDesignerCredit[] = []
  const indexByName = new Map<string, number>()

  for (const raw of value) {
    const record =
      typeof raw === "string"
        ? { name: raw, creditTitle: "" }
        : raw && typeof raw === "object"
          ? (raw as { name?: unknown; creditTitle?: unknown; title?: unknown })
          : null
    if (!record) continue

    const name = normalizeCollaboratorName(record.name)
    const key = collaboratorNameKey(name)
    if (!name || !key) continue

    const creditTitle = normalizeWorkCreditTitle(record.creditTitle ?? record.title)
    const existingIndex = indexByName.get(key)
    if (existingIndex !== undefined) {
      if (!credits[existingIndex].creditTitle && creditTitle) {
        credits[existingIndex] = { ...credits[existingIndex], creditTitle }
      }
      continue
    }

    indexByName.set(key, credits.length)
    credits.push({ name, creditTitle })
  }

  return credits
}

/** 結構化資料優先；舊姓名陣列中尚未出現的人名會依原順序補在最後。 */
export function mergeGuestDesignerCredits(
  value: unknown,
  legacyNames: unknown
): GuestDesignerCredit[] {
  return normalizeGuestDesignerCredits([
    ...normalizeGuestDesignerCredits(value),
    ...normalizeCollaboratorNames(legacyNames).map((name) => ({ name, creditTitle: "" })),
  ])
}

/** 全域改名時保留各作品 Title；若與既有名稱合併，優先保留既有目標的非空 Title。 */
export function renameGuestDesignerCredits(
  value: unknown,
  sourceName: string,
  nextName: string
): GuestDesignerCredit[] {
  const credits = normalizeGuestDesignerCredits(value)
  const sourceKey = collaboratorNameKey(sourceName)
  const normalizedNextName = normalizeCollaboratorName(nextName)
  const nextKey = collaboratorNameKey(normalizedNextName)
  if (!sourceKey || !nextKey) return credits

  const sourceTitle = credits.find((item) => collaboratorNameKey(item.name) === sourceKey)?.creditTitle ?? ""
  const targetTitle = credits.find(
    (item) => collaboratorNameKey(item.name) === nextKey && collaboratorNameKey(item.name) !== sourceKey
  )?.creditTitle ?? ""
  const renamedNames = normalizeCollaboratorNames(
    credits.map((item) =>
      collaboratorNameKey(item.name) === sourceKey ? normalizedNextName : item.name
    )
  )

  return renamedNames.map((name) => {
    const key = collaboratorNameKey(name)
    const existingTitle = credits.find((item) => collaboratorNameKey(item.name) === key)?.creditTitle ?? ""
    return {
      name,
      creditTitle: key === nextKey ? targetTitle || sourceTitle || existingTitle : existingTitle,
    }
  })
}

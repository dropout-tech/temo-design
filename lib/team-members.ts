export const DEFAULT_TEAM_CATEGORY = "DESIGNER 設計團隊"

export type TeamMemberWithCategory = {
  category?: string | null
}

export type TeamMemberGroup<T> = {
  category: string
  members: T[]
}

export function getTeamMemberCategory(member: TeamMemberWithCategory): string {
  return member.category?.trim() || DEFAULT_TEAM_CATEGORY
}

export function getEnglishTeamCategoryLabel(category: string): string {
  const normalized = category.trim()
  const firstHanCharacter = normalized.search(/\p{Script=Han}/u)
  return (firstHanCharacter >= 0 ? normalized.slice(0, firstHanCharacter) : normalized).trim()
}

/**
 * 依「團隊成員」管理頁的分類順序分組；尚未登錄的舊分類接在後面，
 * 同一分類內保留作品關聯或名冊原本的順序。
 */
export function groupTeamMembersByCategory<T extends TeamMemberWithCategory>(
  members: readonly T[],
  categoryOrder: readonly string[] = []
): TeamMemberGroup<T>[] {
  const groups = new Map<string, T[]>()

  for (const member of members) {
    const category = getTeamMemberCategory(member)
    const existingGroup = groups.get(category)
    if (existingGroup) existingGroup.push(member)
    else groups.set(category, [member])
  }

  const orderedCategories = [
    ...categoryOrder.map((category) => category.trim()).filter(Boolean),
    ...groups.keys(),
  ]
  const seen = new Set<string>()

  return orderedCategories
    .filter((category) => {
      if (seen.has(category)) return false
      seen.add(category)
      return groups.has(category)
    })
    .map((category) => ({ category, members: groups.get(category) ?? [] }))
}

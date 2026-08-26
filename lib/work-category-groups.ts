type WorkCategorySource = {
  categoryGroup?: string | null
  categoryGroups?: readonly string[] | null
}

/** 去除空白、空值與重複值，同時保留使用者選取順序。 */
export function normalizeCategoryGroupValues(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const normalized: string[] = []
  for (const raw of values) {
    if (typeof raw !== "string") continue
    const value = raw.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
  }
  return normalized
}

/** 新關聯尚未建立或沒有資料時，退回既有的單一分類欄位。 */
export function getWorkCategoryGroupValues(work: WorkCategorySource): string[] {
  const linked = normalizeCategoryGroupValues(work.categoryGroups)
  if (linked.length > 0) return linked
  return normalizeCategoryGroupValues([work.categoryGroup])
}

export function workHasCategoryGroup(work: WorkCategorySource, value: string): boolean {
  return getWorkCategoryGroupValues(work).includes(value)
}

export function workHasAnyCategoryGroup(
  work: WorkCategorySource,
  values: readonly string[]
): boolean {
  const allowed = new Set(values)
  return getWorkCategoryGroupValues(work).some((value) => allowed.has(value))
}

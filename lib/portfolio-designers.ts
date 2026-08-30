import type { Work } from "@/lib/portfolio-data"
import { isDesignerTeamCategory } from "@/lib/team-members"

/**
 * DB 列表資料會將所有參與團隊成員放在 designerSlugs；前台「設計師」
 * 篩選必須再依團隊分類限制。本地 demo 沒有分類欄位，因此沿用原本全部為
 * 設計師的資料語意。
 */
export function isPortfolioDesignerAt(work: Work, index: number): boolean {
  const category = work.designerCategories?.[index]
  return category === undefined || isDesignerTeamCategory(category)
}

export function workHasPortfolioDesigner(work: Work, slug: string): boolean {
  return work.designerSlugs.some(
    (candidate, index) => candidate === slug && isPortfolioDesignerAt(work, index)
  )
}

const DESIGNER_ENGLISH_FALLBACKS: Record<string, string> = {
  elise: "ELISE WU",
  simik: "SIMIK LIN",
  kevin: "KEVIN KUO",
  shirley: "SHIRLEY LIU",
  sofia: "SOFIA HUANG",
}

type DesignerEnglishLabelInput = {
  slug: string
  workEnglishName?: string
  directoryEnglishName?: string
  fallbackName?: string
}

/**
 * Portfolio filters always show a team member's English name. New Studio
 * members use their saved English name first; known legacy members retain a
 * stable fallback, and incomplete records remain visible instead of vanishing.
 */
export function getPortfolioDesignerEnglishLabel({
  slug,
  workEnglishName,
  directoryEnglishName,
  fallbackName,
}: DesignerEnglishLabelInput): string {
  return (
    workEnglishName?.trim() ||
    directoryEnglishName?.trim() ||
    DESIGNER_ENGLISH_FALLBACKS[slug] ||
    slug.trim() ||
    fallbackName?.trim() ||
    "Team Member"
  )
}

export function getVisibleDesignerSocialUrl(
  value: string | null | undefined,
  visible: boolean | null | undefined
): string | undefined {
  if (visible !== true || !value) return undefined

  const href = value.trim()
  if (!href) return undefined

  try {
    const url = new URL(href)
    return url.protocol === "http:" || url.protocol === "https:" ? href : undefined
  } catch {
    return undefined
  }
}

export type DesignerSocialSource = {
  instagram?: string | null
  facebook?: string | null
  line_url?: string | null
  threads_url?: string | null
  website?: string | null
  show_instagram?: boolean | null
  show_facebook?: boolean | null
  show_line?: boolean | null
  show_threads?: boolean | null
  show_website?: boolean | null
}

export type VisibleDesignerSocialLinks = {
  instagram?: string
  facebook?: string
  lineUrl?: string
  threadsUrl?: string
  website?: string
}

export function getVisibleDesignerSocialLinks(
  source: DesignerSocialSource
): VisibleDesignerSocialLinks {
  return {
    instagram: getVisibleDesignerSocialUrl(source.instagram, source.show_instagram),
    facebook: getVisibleDesignerSocialUrl(source.facebook, source.show_facebook),
    lineUrl: getVisibleDesignerSocialUrl(source.line_url, source.show_line),
    threadsUrl: getVisibleDesignerSocialUrl(source.threads_url, source.show_threads),
    website: getVisibleDesignerSocialUrl(source.website, source.show_website),
  }
}

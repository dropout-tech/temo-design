"use client"

import { useLayoutEffect, type ComponentProps } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getProjectSource, rememberProjectNavigation, type FilterState } from "@/lib/portfolio-navigation"

type PortfolioProjectLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string
  filters?: FilterState
}

export function PortfolioProjectLink({ href, filters, ...props }: PortfolioProjectLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onNavigate={() => rememberProjectNavigation(href, filters)}
    />
  )
}

export function useRestoreProjectSource(setFilters?: (filters: FilterState) => void) {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const source = getProjectSource()
    if (!source) return

    if (source.filters) setFilters?.(source.filters)

    // Wait for the source page and its restored filters to lay out before scrolling.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: source.scrollY, behavior: "instant" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, setFilters])
}

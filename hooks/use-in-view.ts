"use client"

import { useEffect, useRef, useState } from "react"

interface UseInViewOptions {
  once?: boolean
  amount?: number
  rootMargin?: string
}

export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const { once = true, amount = 0.15, rootMargin = "0px" } = options
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.unobserve(element)
        } else if (!once) {
          setIsInView(false)
        }
      },
      { threshold: amount, rootMargin }
    )

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [once, amount, rootMargin])

  return { ref, isInView }
}

import { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled into view (within the given root), then stays true. */
export default function useInView(rootRef, options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { root: rootRef?.current ?? null, threshold: 0.35, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, inView]
}

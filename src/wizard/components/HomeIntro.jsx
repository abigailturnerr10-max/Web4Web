import { useEffect, useRef, useState } from 'react'
import './HomeIntro.css'

const INTRO_BEATS = [
  { text: 'Need a website?', typeSpeedMs: 40, holdMs: 500 },
  { text: "We'll design it — your style, your budget.", typeSpeedMs: 30, holdMs: 400 },
]

/**
 * Blank-screen, two-beat typewriter intro shown once per visitor before the
 * interactive hero. The hero is already mounted underneath — this just
 * overlays it for ~3s so removal reveals an already-usable page instantly,
 * no extra mount delay.
 */
export default function HomeIntro({ onDone }) {
  const [typed, setTyped] = useState('')
  const timersRef = useRef([])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      onDone()
      return
    }

    let cancelled = false

    function runBeat(i) {
      if (cancelled) return
      if (i >= INTRO_BEATS.length) {
        onDone()
        return
      }
      const beat = INTRO_BEATS[i]
      setTyped('')
      let charIndex = 0
      const interval = setInterval(() => {
        charIndex += 1
        setTyped(beat.text.slice(0, charIndex))
        if (charIndex >= beat.text.length) {
          clearInterval(interval)
          const holdTimer = setTimeout(() => {
            setTyped('')
            const nextTimer = setTimeout(() => runBeat(i + 1), 120)
            timersRef.current.push(nextTimer)
          }, beat.holdMs)
          timersRef.current.push(holdTimer)
        }
      }, beat.typeSpeedMs)
      timersRef.current.push(interval)
    }

    const startTimer = setTimeout(() => runBeat(0), 300)
    timersRef.current.push(startTimer)

    return () => {
      cancelled = true
      timersRef.current.forEach(clearInterval)
      timersRef.current.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="home-intro" aria-hidden="true">
      <p className="home-intro__text">
        {typed}
        {typed && <span className="home-intro__caret" />}
      </p>
    </div>
  )
}

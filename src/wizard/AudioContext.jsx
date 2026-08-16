import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AUDIO_CONFIG, PREVIEW_DEMO_SOUNDS } from './audioConfig.js'

const MUTE_KEY = 'web4web:muted'

// Volumes are fractions of full (1.0), chosen from the middle of each
// range's spec: music 10–15%, tap 10–18%, whoosh 12–20%, success 15–25%.
const MUSIC_VOLUME = 0.13
const TAP_VOLUME = 0.14
const WHOOSH_VOLUME = 0.16
const SUCCESS_VOLUME = 0.2

// Background music ducks to roughly 40–50% of its current level while an
// interaction sound plays, then fades back once that sound ends.
const DUCK_FACTOR = 0.45
const DUCK_RECOVER_MS = 300

// Guards against rapid-fire clicking distorting/overlapping tap playback
// without making the UI feel less responsive — short enough to be
// imperceptible as a delay, long enough to prevent audio glitching.
const TAP_COOLDOWN_MS = 60

const AudioCtx = createContext(null)

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Smoothly ramps an <audio> element's volume to a target over durationMs. */
function fadeVolume(el, target, durationMs) {
  if (!el) return
  const start = el.volume
  const startTime = performance.now()
  function step(now) {
    const t = Math.min(1, (now - startTime) / durationMs)
    el.volume = start + (target - start) * t
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function AudioProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try {
      const saved = localStorage.getItem(MUTE_KEY)
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })

  const mutedRef = useRef(muted)
  const musicRef = useRef(null)
  const musicVolumeRef = useRef(MUSIC_VOLUME)
  const duckTimeoutRef = useRef(null)
  const lastTapAtRef = useRef(0)
  const pool = useRef({}) // lazily-created single Audio instance per sound key

  useEffect(() => {
    mutedRef.current = muted
    try {
      localStorage.setItem(MUTE_KEY, String(muted))
    } catch {
      /* localStorage unavailable — mute preference just won't persist */
    }
    // The mute toggle click is itself the "user interaction" browsers
    // require before audio can play — unmuting is what starts music, not a
    // background attempt on page load. playMusic() lazily creates the
    // element the first time this fires, so no separate init step is needed.
    if (muted) musicRef.current?.pause()
    else playMusic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted])

  useEffect(() => {
    return () => {
      clearTimeout(duckTimeoutRef.current)
      // Stop the music with this provider — a lingering instance left
      // playing past unmount is exactly what caused the overlapping-music
      // bug (see App.jsx's comment on why there's now only ever one
      // AudioProvider for the app's whole lifetime; this is the backstop
      // in case that ever changes again).
      musicRef.current?.pause()
    }
  }, [])

  function getSound(key) {
    if (!pool.current[key]) {
      const el = new Audio(AUDIO_CONFIG[key])
      el.preload = 'none'
      pool.current[key] = el
    }
    return pool.current[key]
  }

  function duckMusicWhile(el) {
    const music = musicRef.current
    if (!music) return
    clearTimeout(duckTimeoutRef.current)
    music.volume = musicVolumeRef.current * DUCK_FACTOR
    const recover = () => {
      el.removeEventListener('ended', recover)
      fadeVolume(music, musicVolumeRef.current, DUCK_RECOVER_MS)
    }
    el.addEventListener('ended', recover)
    // Fallback in case 'ended' never fires (e.g. play() was blocked) — don't
    // leave the music permanently ducked.
    duckTimeoutRef.current = setTimeout(recover, 2000)
  }

  function playInteractionSound(key, volume) {
    if (mutedRef.current) return
    const el = getSound(key)
    el.volume = volume
    el.currentTime = 0
    duckMusicWhile(el)
    el.play().catch(() => {
      /* browser blocked it, or file not dropped in yet — silently ignore */
    })
  }

  function playTap() {
    const now = Date.now()
    if (now - lastTapAtRef.current < TAP_COOLDOWN_MS) return
    lastTapAtRef.current = now
    playInteractionSound('tap', TAP_VOLUME)
  }

  function playWhoosh() {
    if (prefersReducedMotion()) return
    const el = getSound('whoosh')
    // Never overlap with itself — if one's already playing, let it finish.
    if (!el.paused && !el.ended) return
    playInteractionSound('whoosh', WHOOSH_VOLUME)
  }

  function playSuccess() {
    playInteractionSound('success', SUCCESS_VOLUME)
  }

  /** "Completing the configurator" is both a transition and a completion —
   * whoosh then success, sequenced, never all three sounds stacked. */
  function playWhooshThenSuccess() {
    playWhoosh()
    setTimeout(playSuccess, 280)
  }

  function playMusic() {
    // Idempotent — if it's already loaded and playing, do nothing. Never
    // create a second instance or restart one that's already going.
    if (musicRef.current && !musicRef.current.paused && !musicRef.current.ended) return
    if (!musicRef.current) {
      const el = new Audio(AUDIO_CONFIG.music)
      el.loop = true
      el.preload = 'none'
      el.volume = musicVolumeRef.current
      musicRef.current = el
    }
    if (!mutedRef.current) musicRef.current.play().catch(() => {})
  }

  function stopMusic() {
    musicRef.current?.pause()
  }

  function setMusicVolume(v) {
    musicVolumeRef.current = v
    if (musicRef.current) musicRef.current.volume = v
  }

  function toggleMute() {
    setMuted((m) => !m)
  }

  /** Separate, unducked, uncooled system for the Configurator preview's
   * purchasable-effect sound demos — see audioConfig.js. */
  function playPreviewSound(name) {
    if (mutedRef.current) return
    const src = PREVIEW_DEMO_SOUNDS[name]
    if (!src) return
    if (!pool.current[`preview:${name}`]) {
      const el = new Audio(src)
      el.preload = 'none'
      pool.current[`preview:${name}`] = el
    }
    const el = pool.current[`preview:${name}`]
    el.currentTime = 0
    el.play().catch(() => {})
  }

  // Web4Web's own UI feedback — every button tap and configurator selection
  // funnels through here, so nothing needs its own click handler wired in.
  // Excludes the mute button itself (toggling mute already communicates its
  // own state change) and anything opting out via data-no-tap-sound.
  useEffect(() => {
    function handleClick(e) {
      const target = e.target.closest('button')
      if (!target || target.closest('.mute-toggle') || target.closest('[data-no-tap-sound]')) return
      playTap()
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    muted,
    toggleMute,
    playTap,
    playWhoosh,
    playSuccess,
    playWhooshThenSuccess,
    playMusic,
    stopMusic,
    setMusicVolume,
    playPreviewSound,
  }

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider')
  return ctx
}

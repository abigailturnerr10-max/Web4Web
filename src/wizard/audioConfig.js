/**
 * Centralized audio path config — the only place these path strings should
 * ever appear. Swap a file at one of these paths and every consumer picks
 * it up automatically, zero code changes elsewhere (see AudioContext.jsx).
 */
export const AUDIO_CONFIG = {
  music: '/audio/web4web-music.mp3',
  tap: '/audio/ui-tap.mp3',
  whoosh: '/audio/ui-whoosh.mp3',
  success: '/audio/ui-success.mp3',
}

/**
 * A separate, smaller system: sound-effect PREVIEWS shown inside the
 * Configurator's live preview when a client demos a purchasable sound
 * effect for their own future site (see PreviewEffects.jsx's
 * SoundActionDemo / ButtonPopDemo). Not part of Web4Web's own tap/whoosh/
 * success/music system above — a different product feature entirely.
 * Same "silent no-op until a real file is dropped in" placeholder pattern.
 */
export const PREVIEW_DEMO_SOUNDS = {
  successChime: '/audio/success-chime.mp3',
  playfulChime: '/audio/playful-chime.mp3',
  buttonPop: '/audio/button-pop.mp3',
}

import { useAudio } from '../AudioContext.jsx'
import './MuteToggle.css'

/** Single persistent audio control — governs background music AND every UI sound effect. */
export default function MuteToggle() {
  const { muted, toggleMute } = useAudio()
  return (
    <button
      type="button"
      className={'mute-toggle' + (muted ? '' : ' mute-toggle--active')}
      onClick={toggleMute}
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
        {muted && <path d="M2 2l20 20" strokeWidth="2" />}
      </svg>
    </button>
  )
}

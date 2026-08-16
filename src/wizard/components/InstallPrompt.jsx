import { useEffect, useState } from 'react'
import './InstallPrompt.css'

const DISMISSED_KEY = 'web4web:install-dismissed'
const SHOW_AFTER_MS = 20000 // a meaningful interaction, not an on-load ambush

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer = null

    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      let dismissed = false
      try {
        dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
      } catch {
        /* localStorage unavailable — just don't persist the dismissal */
      }
      if (!dismissed) {
        timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
      }
    }

    function handleAppInstalled() {
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      /* localStorage unavailable — prompt just may reappear next visit */
    }
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Web4Web">
      <span className="install-prompt__text">Install Web4Web for faster access next time?</span>
      <div className="install-prompt__actions">
        <button type="button" className="install-prompt__install" data-no-tap-sound onClick={install}>
          Install
        </button>
        <button type="button" className="install-prompt__dismiss" data-no-tap-sound onClick={dismiss} aria-label="Dismiss">
          Not now
        </button>
      </div>
    </div>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AudioProvider } from './wizard/AudioContext.jsx'
import MuteToggle from './wizard/components/MuteToggle.jsx'
import InstallPrompt from './wizard/components/InstallPrompt.jsx'
import WelcomeBackGate from './wizard/components/WelcomeBackGate.jsx'
import Footer from './wizard/components/Footer.jsx'
import Home from './wizard/pages/Home.jsx'
import Info from './wizard/pages/Info.jsx'
import Configurator from './wizard/pages/Configurator.jsx'
import Timeline from './wizard/pages/Timeline.jsx'
import Review from './wizard/pages/Review.jsx'
import Confirmation from './wizard/pages/Confirmation.jsx'
import NotFound from './wizard/pages/NotFound.jsx'
import SubmitContent from './wizard/content/SubmitContent.jsx'
import AdminApp from './admin/AdminApp.jsx'
import './App.css'

// The wizard's own chrome (mute control, welcome-back gate, footer) only
// makes sense for the configurator flow itself — the post-payment content
// link and the internal admin tool are separate audiences and get none of
// the visible chrome. AudioProvider itself, though, lives once at the App
// root (below) — it previously wrapped WizardLayout AND SubmitContent
// separately, which meant two independent React instances each holding
// their own music <audio> element. Navigating between them (e.g.
// Confirmation → "Tell us about your business →" → /submit-content)
// unmounted one provider without pausing its music and mounted the other,
// which started a second track — the overlapping-music bug. One provider
// for the whole app's lifetime removes the double-instantiation entirely.
function WizardLayout() {
  return (
    <>
      <MuteToggle />
      <WelcomeBackGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/info" element={<Info />} />
          <Route path="/configurator" element={<Configurator />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/review" element={<Review />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </WelcomeBackGate>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <Routes>
          <Route path="/submit-content" element={<SubmitContent />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<WizardLayout />} />
        </Routes>
      </AudioProvider>
      <InstallPrompt />
    </BrowserRouter>
  )
}

export default App

import TopBar from './TopBar.jsx'
import './StepLayout.css'

export default function StepLayout({ currentPath, children, wide = false }) {
  return (
    <div className="page">
      <TopBar currentPath={currentPath} />
      <main className={'topbar-main' + (wide ? ' topbar-main--wide' : '')}>{children}</main>
    </div>
  )
}

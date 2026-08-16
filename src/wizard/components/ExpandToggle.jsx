export default function ExpandToggle({ expanded, onToggle, hiddenCount }) {
  if (hiddenCount <= 0) return null
  return (
    <button type="button" className="expand-toggle" onClick={onToggle}>
      {expanded ? 'Show fewer options' : `See all options (+${hiddenCount} more)`}
    </button>
  )
}

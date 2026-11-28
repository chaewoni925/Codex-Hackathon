export function ActionIcon({ name }: { name: 'back' | 'check' | 'camera' | 'change' }) {
  const drawing = {
    back: <path d="M18 12H6m6-6-6 6 6 6" />,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3z" /><circle cx="12" cy="13" r="3.5" /></>,
    change: <><path d="M7 3h7l4 4v14H7zM14 3v5h4" /><path d="m10 14 2 2 3-4" /></>,
  }
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">{drawing[name]}</svg>
}

import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isHome = location.pathname === '/'
  const isMatch = location.pathname === '/match'
  const isAdd = location.pathname === '/add' || location.pathname.startsWith('/edit')

  // Hide nav on detail page
  if (location.pathname.startsWith('/property/')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto">
      <div className="bg-surface border-t border-accent/10 px-6 pt-2 pb-6 safe-bottom flex items-center justify-between relative">

        {/* Home Tab */}
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 px-6 py-1 transition-colors ${isHome ? 'text-accent' : 'text-text-muted'}`}
        >
          <svg className="w-6 h-6" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* FAB Add Button */}
        <button
          onClick={() => navigate('/add')}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-accent/20 -mt-6 transition-transform active:scale-95
            ${isAdd ? 'bg-accent' : 'bg-accent/80'}`}
        >
          <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Match Tab */}
        <button
          onClick={() => navigate('/match')}
          className={`flex flex-col items-center gap-1 px-6 py-1 transition-colors ${isMatch ? 'text-accent' : 'text-text-muted'}`}
        >
          <svg className="w-6 h-6" fill={isMatch ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span className="text-xs font-medium">Match</span>
        </button>

      </div>
    </div>
  )
}

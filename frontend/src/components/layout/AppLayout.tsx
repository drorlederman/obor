import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { useFCM } from '@/hooks/useFCM'

// --- Dark mode ---
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('obor_dark_mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('obor_dark_mode', String(dark))
  }, [dark])

  return [dark, () => setDark((d) => !d)] as const
}

// --- Inline SVG icon ---
function Icon({ d, size = 24 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  dashboard:
    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  bookings:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  credits:
    'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  maintenance:
    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  more: 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun: 'M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
  switchBoat:
    'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3',
  profile:
    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
}

const ROLE_LABELS: Record<string, string> = {
  partner: 'שותף',
  scheduler: 'מתזמן',
  treasurer: 'גזבר',
  maintenanceManager: 'מנהל תחזוקה',
  admin: 'מנהל',
}

const BOTTOM_TABS = [
  { to: '/dashboard', label: 'לוח בקרה', icon: ICONS.dashboard },
  { to: '/bookings', label: 'יומן', icon: ICONS.bookings },
  { to: '/credits', label: 'מטבעות', icon: ICONS.credits },
  { to: '/maintenance', label: 'תחזוקה', icon: ICONS.maintenance },
]

const SIDEBAR_ITEMS = [
  { to: '/dashboard', label: 'לוח בקרה', icon: ICONS.dashboard },
  { to: '/bookings', label: 'יומן הזמנות', icon: ICONS.bookings },
  { to: '/credits', label: 'מטבעות', icon: ICONS.credits },
  { to: '/finance', label: 'פיננסים', icon: ICONS.credits },
  { to: '/maintenance', label: 'תחזוקה', icon: ICONS.maintenance },
  { to: '/announcements', label: 'הודעות', icon: ICONS.more },
  { to: '/checklists', label: "צ'קליסטים", icon: ICONS.more },
  { to: '/contacts', label: 'אנשי קשר', icon: ICONS.profile },
  { to: '/feedback', label: 'פידבק', icon: ICONS.more },
]

export default function AppLayout() {
  const { activeBoatId, activeRole, memberships } = useBoat()
  const { user, signOut } = useAuth()
  const [dark, toggleDark] = useDarkMode()
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  useFCM(user?.uid)

  const activeMembership = memberships.find((m) => m.boatId === activeBoatId)
  const boatName = activeMembership?.boatName ?? 'OBOR'
  const roleLabel = activeRole ? (ROLE_LABELS[activeRole] ?? activeRole) : ''

  const initials = (user?.displayName ?? user?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left side (RTL end): dark mode + avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="החלף מצב תאורה"
            >
              {dark ? <Icon d={ICONS.sun} size={20} /> : <Icon d={ICONS.moon} size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center select-none">
              {initials}
            </div>
          </div>

          {/* Right side (RTL start): boat name + role */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {boatName}
            </span>
            {roleLabel && (
              <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                {roleLabel}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Body: sidebar (desktop) + main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only, placed at end (RTL: right side) */}
        <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-900 border-s border-gray-200 dark:border-gray-800 shrink-0 order-last">
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon d={item.icon} size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
            <NavLink
              to="/switch-boat"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon d={ICONS.switchBoat} size={18} />
              <span>החלף סירה</span>
            </NavLink>
            <NavLink
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon d={ICONS.profile} size={18} />
              <span>פרופיל</span>
            </NavLink>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Icon d={ICONS.logout} size={18} />
              <span>יציאה</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom tab bar — mobile only ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex">
          {BOTTOM_TABS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <Icon d={item.icon} size={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            <Icon d={ICONS.more} size={22} />
            <span>עוד</span>
          </button>
        </div>
      </nav>

      {/* ── More menu sheet — mobile ── */}
      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="md:hidden fixed bottom-16 inset-x-0 z-50 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {user?.displayName ?? user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
            </div>
            <div className="p-2 space-y-1">
              {[
                { to: '/announcements', label: 'הודעות' },
                { to: '/checklists', label: "צ'קליסטים" },
                { to: '/contacts', label: 'אנשי קשר' },
                { to: '/finance', label: 'פיננסים' },
                { to: '/feedback', label: 'פידבק' },
                { to: '/switch-boat', label: 'החלף סירה' },
                { to: '/profile', label: 'פרופיל' },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full text-right px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                יציאה
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'

interface SettingCard {
  to: string
  icon: string
  title: string
  desc: string
}

const CARDS: SettingCard[] = [
  { to: '/settings/credits',       icon: '🪙', title: 'הגדרות מטבעות',  desc: 'כמות מטבעות ועלות להפלגה' },
  { to: '/settings/notifications', icon: '🔔', title: 'התראות',          desc: 'העדפות התראות ועדכונים' },
  { to: '/settings/weather',       icon: '🌤️', title: 'מזג אוויר',       desc: 'מרינה ומיקום לתחזית' },
  { to: '/audit',                  icon: '📋', title: 'יומן ביקורת',     desc: 'היסטוריית פעולות במערכת' },
  { to: '/backups',                icon: '💾', title: 'גיבוי ושחזור',    desc: 'יצירה ושחזור גיבויים' },
  { to: '/partners',               icon: '👥', title: 'ניהול שותפים',    desc: 'תפקידים, הרשאות והקפאה' },
]

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">הגדרות מערכת</h1>

      <div className="space-y-2">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="card flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          >
            <span className="text-2xl flex-shrink-0">{card.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.desc}</p>
            </div>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0 rotate-180">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

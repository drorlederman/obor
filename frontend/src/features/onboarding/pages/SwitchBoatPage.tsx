import { useNavigate } from 'react-router-dom'
import { useBoat, type MemberRole } from '@/context/BoatContext'

const ROLE_LABELS: Record<MemberRole, string> = {
  partner: 'שותף',
  scheduler: 'מתזמן',
  treasurer: 'גזבר',
  maintenanceManager: 'אחמ"ש',
  admin: 'מנהל',
}

const ROLE_COLORS: Record<MemberRole, string> = {
  partner: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  scheduler: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  treasurer: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  maintenanceManager: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

export default function SwitchBoatPage() {
  const navigate = useNavigate()
  const { memberships, activeBoatId, switchBoat } = useBoat()

  const activeBoats = memberships.filter((m) => m.status === 'active')

  function handleSelect(boatId: string) {
    switchBoat(boatId)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-sm mx-auto px-4 pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="חזרה"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">בחר סירה</h1>
        </div>

        {activeBoats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⛵</div>
            <p className="text-gray-500 dark:text-gray-400">אינך שייך לסירות פעילות</p>
            <button
              onClick={() => navigate('/welcome')}
              className="mt-4 btn-primary"
            >
              הצטרף לסירה
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBoats.map((boat) => {
              const isActive = boat.boatId === activeBoatId
              return (
                <button
                  key={boat.boatId}
                  onClick={() => handleSelect(boat.boatId)}
                  className={`w-full flex items-center gap-4 rounded-2xl p-4 text-right transition-all border ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {boat.boatName}
                      </span>
                      {isActive && (
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                          פעיל
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[boat.role]}`}
                      >
                        {ROLE_LABELS[boat.role]}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="text-primary-500 text-xl">✓</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 text-xl">›</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

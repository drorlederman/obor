import { useBoat, type MemberRole } from '@/context/BoatContext'

interface RoleGuardProps {
  roles: MemberRole[]
  children: React.ReactNode
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { activeRole } = useBoat()

  if (!activeRole || !roles.includes(activeRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">אין גישה</h2>
        <p className="text-gray-500 dark:text-gray-400">אין לך הרשאה לצפות בדף זה.</p>
      </div>
    )
  }

  return <>{children}</>
}

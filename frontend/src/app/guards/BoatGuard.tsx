import { Navigate, Outlet } from 'react-router-dom'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface BoatGuardProps {
  children?: React.ReactNode
}

export default function BoatGuard({ children }: BoatGuardProps) {
  const { user, loading } = useAuth()
  const { activeBoatId, memberships, loading: boatLoading } = useBoat()

  if (loading || boatLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user has no active memberships, send to welcome
  if (memberships.length === 0 || !activeBoatId) {
    return <Navigate to="/welcome" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

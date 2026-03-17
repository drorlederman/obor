import { useBoat } from '@/context/BoatContext'

interface FrozenGuardProps {
  children: React.ReactNode
  message?: string
}

// Wrap around actions that frozen partners cannot perform
export default function FrozenGuard({ children, message }: FrozenGuardProps) {
  const { activeBoatId } = useBoat()

  // Frozen status is checked at the server level too.
  // This component prevents UI from even showing the action.
  // The actual `frozen` status is stored on the partner document.
  // For now, this guard passes through — financial status is checked per-feature.
  void activeBoatId
  void message

  return <>{children}</>
}

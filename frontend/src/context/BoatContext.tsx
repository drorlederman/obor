import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export type MemberRole = 'partner' | 'scheduler' | 'treasurer' | 'maintenanceManager' | 'admin'
export type MemberStatus = 'active' | 'removed'

export interface BoatMembership {
  boatId: string
  boatName: string
  role: MemberRole
  status: MemberStatus
}

interface BoatContextValue {
  activeBoatId: string | null
  activeRole: MemberRole | null
  memberships: BoatMembership[]
  switchBoat: (boatId: string) => void
  refreshMemberships: () => Promise<void>
  isAdmin: boolean
  isScheduler: boolean
  isTreasurer: boolean
  isMaintenanceManager: boolean
}

const BoatContext = createContext<BoatContextValue | null>(null)

const ACTIVE_BOAT_KEY = 'obor_active_boat'

export function BoatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<BoatMembership[]>([])
  const [activeBoatId, setActiveBoatId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setMemberships([])
      setActiveBoatId(null)
      return
    }

    // Memberships come from Firebase Custom Claims token
    user.getIdTokenResult(true).then((tokenResult) => {
      const claims = tokenResult.claims as {
        memberships?: Record<string, { role: MemberRole; status: MemberStatus; boatName?: string }>
      }

      const membershipList: BoatMembership[] = Object.entries(claims.memberships ?? {}).map(
        ([boatId, data]) => ({
          boatId,
          boatName: data.boatName ?? boatId,
          role: data.role,
          status: data.status,
        }),
      )

      setMemberships(membershipList)

      // Restore last active boat or pick first available
      const savedBoatId = localStorage.getItem(ACTIVE_BOAT_KEY)
      const savedExists = membershipList.some((m) => m.boatId === savedBoatId && m.status === 'active')

      if (savedBoatId && savedExists) {
        setActiveBoatId(savedBoatId)
      } else {
        const firstActive = membershipList.find((m) => m.status === 'active')
        setActiveBoatId(firstActive?.boatId ?? null)
        if (firstActive) localStorage.setItem(ACTIVE_BOAT_KEY, firstActive.boatId)
      }
    })
  }, [user])

  function switchBoat(boatId: string) {
    setActiveBoatId(boatId)
    localStorage.setItem(ACTIVE_BOAT_KEY, boatId)
  }

  async function refreshMemberships(): Promise<void> {
    if (!user) return
    const tokenResult = await user.getIdTokenResult(true) // force-refresh token
    const claims = tokenResult.claims as {
      memberships?: Record<string, { role: MemberRole; status: MemberStatus; boatName?: string }>
    }

    const membershipList: BoatMembership[] = Object.entries(claims.memberships ?? {}).map(
      ([boatId, data]) => ({
        boatId,
        boatName: data.boatName ?? boatId,
        role: data.role,
        status: data.status,
      }),
    )

    setMemberships(membershipList)

    const savedBoatId = localStorage.getItem(ACTIVE_BOAT_KEY)
    const savedExists = membershipList.some((m) => m.boatId === savedBoatId && m.status === 'active')

    if (savedBoatId && savedExists) {
      setActiveBoatId(savedBoatId)
    } else {
      const firstActive = membershipList.find((m) => m.status === 'active')
      setActiveBoatId(firstActive?.boatId ?? null)
      if (firstActive) localStorage.setItem(ACTIVE_BOAT_KEY, firstActive.boatId)
    }
  }

  const activeMembership = memberships.find((m) => m.boatId === activeBoatId)
  const activeRole = activeMembership?.role ?? null

  return (
    <BoatContext.Provider
      value={{
        activeBoatId,
        activeRole,
        memberships,
        switchBoat,
        refreshMemberships,
        isAdmin: activeRole === 'admin',
        isScheduler: activeRole === 'scheduler' || activeRole === 'admin',
        isTreasurer: activeRole === 'treasurer' || activeRole === 'admin',
        isMaintenanceManager: activeRole === 'maintenanceManager' || activeRole === 'admin',
      }}
    >
      {children}
    </BoatContext.Provider>
  )
}

export function useBoat(): BoatContextValue {
  const ctx = useContext(BoatContext)
  if (!ctx) throw new Error('useBoat must be used within BoatProvider')
  return ctx
}

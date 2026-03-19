import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '@/lib/firebase'

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
  loading: boolean
  switchBoat: (boatId: string) => void
  refreshMemberships: () => Promise<void>
  isAdmin: boolean
  isScheduler: boolean
  isTreasurer: boolean
  isMaintenanceManager: boolean
}

const BoatContext = createContext<BoatContextValue | null>(null)

const ACTIVE_BOAT_KEY = 'obor_active_boat'
type ClaimMembership = { role: MemberRole; status: MemberStatus; boatName?: string }

function mapClaimsToMemberships(claimsMemberships: Record<string, ClaimMembership> | undefined): BoatMembership[] {
  return Object.entries(claimsMemberships ?? {}).map(([boatId, data]) => ({
    boatId,
    boatName: data.boatName ?? boatId,
    role: data.role,
    status: data.status,
  }))
}

export function BoatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<BoatMembership[]>([])
  const [activeBoatId, setActiveBoatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function applyActiveBoat(membershipList: BoatMembership[]) {
    const savedBoatId = localStorage.getItem(ACTIVE_BOAT_KEY)
    const savedExists = membershipList.some((m) => m.boatId === savedBoatId && m.status === 'active')

    if (savedBoatId && savedExists) {
      setActiveBoatId(savedBoatId)
      return
    }

    const firstActive = membershipList.find((m) => m.status === 'active')
    setActiveBoatId(firstActive?.boatId ?? null)
    if (firstActive) localStorage.setItem(ACTIVE_BOAT_KEY, firstActive.boatId)
  }

  const loadMembershipsFromFirestore = useCallback(async (userId: string): Promise<BoatMembership[]> => {
    const membersSnap = await getDocs(
      query(collection(db, 'boat_members'), where('userId', '==', userId)),
    )

    if (membersSnap.empty) return []

    const rawMemberships = membersSnap.docs.map((membershipDoc) => {
      const data = membershipDoc.data()
      return {
        boatId: data.boatId as string,
        role: data.role as MemberRole,
        status: data.status as MemberStatus,
      }
    })

    const boatNameById = new Map<string, string>()
    await Promise.all(
      [...new Set(rawMemberships.map((m) => m.boatId))].map(async (boatId) => {
        try {
          const boatSnap = await getDoc(doc(db, 'boats', boatId))
          boatNameById.set(boatId, (boatSnap.data()?.name as string | undefined) ?? boatId)
        } catch {
          boatNameById.set(boatId, boatId)
        }
      }),
    )

    return rawMemberships.map((membership) => ({
      ...membership,
      boatName: boatNameById.get(membership.boatId) ?? membership.boatId,
    }))
  }, [])

  const loadMemberships = useCallback(async (forceRefreshToken: boolean): Promise<BoatMembership[]> => {
    if (!user) return []

    const tokenResult = await user.getIdTokenResult(forceRefreshToken)
    const claims = tokenResult.claims as { memberships?: Record<string, ClaimMembership> }

    const fromClaims = mapClaimsToMemberships(claims.memberships)
    if (fromClaims.length > 0) return fromClaims

    // Fallback: newly created memberships may exist before custom claims propagation.
    return loadMembershipsFromFirestore(user.uid)
  }, [loadMembershipsFromFirestore, user])

  useEffect(() => {
    if (!user) {
      setMemberships([])
      setActiveBoatId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    loadMemberships(true)
      .then((membershipList) => {
        setMemberships(membershipList)
        applyActiveBoat(membershipList)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [loadMemberships, user])

  function switchBoat(boatId: string) {
    setActiveBoatId(boatId)
    localStorage.setItem(ACTIVE_BOAT_KEY, boatId)
  }

  async function refreshMemberships(): Promise<void> {
    if (!user) return
    setLoading(true)
    try {
      const membershipList = await loadMemberships(true)
      setMemberships(membershipList)
      applyActiveBoat(membershipList)
    } finally {
      setLoading(false)
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
        loading,
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

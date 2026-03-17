import type { MemberRole } from './partner'

export type BoatStatus = 'active' | 'maintenance' | 'inactive'
export type MemberStatus = 'active' | 'frozen' | 'removed'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface Boat {
  id: string
  name: string
  code: string
  status: BoatStatus
  homeMarina: string | null
  ownerUserId: string
  memberCount: number
  createdAt: Date
  updatedAt: Date
}

export interface BoatMember {
  id: string
  boatId: string
  userId: string
  partnerId: string | null
  role: MemberRole
  status: MemberStatus
  invitedByUserId: string | null
  invitedAt: Date | null
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Invitation {
  id: string
  boatId: string
  boatName: string
  email: string
  role: MemberRole
  token: string
  status: InvitationStatus
  invitedByUserId: string
  createdAt: Date
  expiresAt: Date
  acceptedAt: Date | null
  acceptedByUserId: string | null
}

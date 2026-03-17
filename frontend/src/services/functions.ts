import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import type { MemberRole, BookingType, TicketStatus, ChargeCategory, PaymentMethod } from '@/types'

// ============================================================
// Boats & Membership
// ============================================================

export interface CreateBoatInput {
  name: string
  code: string
  homeMarina?: string | null
}

export interface CreateBoatResult {
  success: boolean
  boatId: string
  partnerId: string
}

export interface InvitePartnerInput {
  boatId: string
  email: string
  role: MemberRole
}

export interface InvitePartnerResult {
  success: boolean
  invitationId: string
  token: string
}

export interface AcceptInvitationInput {
  token: string
}

export interface AcceptInvitationResult {
  success: boolean
  boatId: string
  partnerId: string
}

export interface RevokeInvitationInput {
  invitationId: string
}

export interface RevokeInvitationResult {
  success: boolean
}

export interface RemoveMemberInput {
  boatId: string
  userId: string
}

export interface RemoveMemberResult {
  success: boolean
}

export interface ChangeMemberRoleInput {
  boatId: string
  userId: string
  newRole: MemberRole
}

export interface ChangeMemberRoleResult {
  success: boolean
}

// ============================================================
// Bookings
// ============================================================

export interface CreateBookingInput {
  boatId: string
  ownerPartnerId: string
  type: BookingType
  title: string
  notes?: string | null
  startTime: string  // ISO string
  endTime: string    // ISO string
}

export interface CreateBookingResult {
  success: boolean
  bookingId: string
}

export interface CancelBookingInput {
  bookingId: string
}

export interface CancelBookingResult {
  success: boolean
}

export interface JoinPartnerSailInput {
  bookingId: string
  partnerPartnerId: string
}

export interface JoinPartnerSailResult {
  success: boolean
}

// ============================================================
// Credits
// ============================================================

export interface AdjustCreditsInput {
  boatId: string
  partnerId: string
  creditType: 'weekday' | 'weekend'
  operation: 'add' | 'subtract'
  amount: number
  description: string
}

export interface AdjustCreditsResult {
  success: boolean
  newBalance: number
}

// ============================================================
// Finance
// ============================================================

export interface CreateChargeInput {
  boatId: string
  title: string
  description?: string | null
  category: ChargeCategory
  totalAmount: number
  dueDate: string  // ISO string
}

export interface CreateChargeResult {
  success: boolean
  chargeId: string
}

export interface PublishChargeInput {
  chargeId: string
}

export interface PublishChargeResult {
  success: boolean
  invoicesCreated: number
}

export interface RegisterPaymentInput {
  invoiceId: string
  amount: number
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
  paidAt: string  // ISO string
}

export interface RegisterPaymentResult {
  success: boolean
  paymentId: string
}

export interface FreezePartnerInput {
  boatId: string
  partnerId: string
}

export interface FreezePartnerResult {
  success: boolean
}

export interface UnfreezePartnerInput {
  boatId: string
  partnerId: string
}

export interface UnfreezePartnerResult {
  success: boolean
}

// ============================================================
// Maintenance
// ============================================================

export interface UpdateMaintenanceStatusInput {
  ticketId: string
  status: TicketStatus
  comment?: string | null
}

export interface UpdateMaintenanceStatusResult {
  success: boolean
  updateId: string
}

export interface AddMaintenanceUpdateInput {
  ticketId: string
  comment: string
}

export interface AddMaintenanceUpdateResult {
  success: boolean
  updateId: string
}

// ============================================================
// Backup
// ============================================================

export interface CreateSystemBackupInput {
  boatId: string
  notes?: string | null
}

export interface CreateSystemBackupResult {
  success: boolean
  backupId: string
  totalDocuments: number
}

export interface RestoreBackupInput {
  backupId: string
  confirm: true
}

export interface RestoreBackupResult {
  success: boolean
  totalRestored: number
}

// ============================================================
// Callable references
// ============================================================

// Boats & Membership
export const createBoatFn = httpsCallable<CreateBoatInput, CreateBoatResult>(functions, 'createBoat')
export const invitePartnerFn = httpsCallable<InvitePartnerInput, InvitePartnerResult>(functions, 'invitePartner')
export const acceptInvitationFn = httpsCallable<AcceptInvitationInput, AcceptInvitationResult>(functions, 'acceptInvitation')
export const revokeInvitationFn = httpsCallable<RevokeInvitationInput, RevokeInvitationResult>(functions, 'revokeInvitation')
export const removeMemberFn = httpsCallable<RemoveMemberInput, RemoveMemberResult>(functions, 'removeMember')
export const changeMemberRoleFn = httpsCallable<ChangeMemberRoleInput, ChangeMemberRoleResult>(functions, 'changeMemberRole')

// Bookings
export const createBookingFn = httpsCallable<CreateBookingInput, CreateBookingResult>(functions, 'createBooking')
export const cancelBookingFn = httpsCallable<CancelBookingInput, CancelBookingResult>(functions, 'cancelBooking')
export const joinPartnerSailFn = httpsCallable<JoinPartnerSailInput, JoinPartnerSailResult>(functions, 'joinPartnerSail')

// Credits
export const adjustCreditsFn = httpsCallable<AdjustCreditsInput, AdjustCreditsResult>(functions, 'adjustCredits')

// Finance
export const createChargeFn = httpsCallable<CreateChargeInput, CreateChargeResult>(functions, 'createCharge')
export const publishChargeFn = httpsCallable<PublishChargeInput, PublishChargeResult>(functions, 'publishCharge')
export const registerPaymentFn = httpsCallable<RegisterPaymentInput, RegisterPaymentResult>(functions, 'registerPayment')
export const freezePartnerFn = httpsCallable<FreezePartnerInput, FreezePartnerResult>(functions, 'freezePartner')
export const unfreezePartnerFn = httpsCallable<UnfreezePartnerInput, UnfreezePartnerResult>(functions, 'unfreezePartner')

// Maintenance
export const updateMaintenanceStatusFn = httpsCallable<UpdateMaintenanceStatusInput, UpdateMaintenanceStatusResult>(functions, 'updateMaintenanceStatus')
export const addMaintenanceUpdateFn = httpsCallable<AddMaintenanceUpdateInput, AddMaintenanceUpdateResult>(functions, 'addMaintenanceUpdate')

// Backup
export const createSystemBackupFn = httpsCallable<CreateSystemBackupInput, CreateSystemBackupResult>(functions, 'createSystemBackup')
export const restoreBackupFn = httpsCallable<RestoreBackupInput, RestoreBackupResult>(functions, 'restoreBackup')

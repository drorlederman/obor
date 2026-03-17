import { initializeApp } from 'firebase-admin/app'

// Initialize Firebase Admin SDK once
initializeApp()

// Boat & Membership functions
export * from './boats/createBoat'
export * from './boats/invitePartner'
export * from './boats/acceptInvitation'
export * from './boats/revokeInvitation'
export * from './boats/removeMember'
export * from './boats/changeMemberRole'

// Booking functions
export * from './bookings/createBooking'
export * from './bookings/cancelBooking'
export * from './bookings/joinPartnerSail'

// Credits
export * from './credits/adjustCredits'

// Finance
export * from './finance/createCharge'
export * from './finance/publishCharge'
export * from './finance/registerPayment'
export * from './finance/freezePartner'
export * from './finance/unfreezePartner'

// Maintenance
export * from './maintenance/updateMaintenanceStatus'
export * from './maintenance/addMaintenanceUpdate'

// Backup
export * from './backup/createSystemBackup'
export * from './backup/restoreBackup'

// Scheduled functions
export * from './scheduled/markOverdueInvoices'
export * from './scheduled/expireInvitations'
export * from './scheduled/paymentReminders'
export * from './scheduled/maintenanceAlerts'

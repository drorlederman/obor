"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin SDK once
(0, app_1.initializeApp)();
// Boat & Membership functions
__exportStar(require("./boats/createBoat"), exports);
__exportStar(require("./boats/invitePartner"), exports);
__exportStar(require("./boats/acceptInvitation"), exports);
__exportStar(require("./boats/revokeInvitation"), exports);
__exportStar(require("./boats/removeMember"), exports);
__exportStar(require("./boats/changeMemberRole"), exports);
// Booking functions
__exportStar(require("./bookings/createBooking"), exports);
__exportStar(require("./bookings/cancelBooking"), exports);
__exportStar(require("./bookings/joinPartnerSail"), exports);
// Credits
__exportStar(require("./credits/adjustCredits"), exports);
// Finance
__exportStar(require("./finance/createCharge"), exports);
__exportStar(require("./finance/publishCharge"), exports);
__exportStar(require("./finance/registerPayment"), exports);
__exportStar(require("./finance/freezePartner"), exports);
__exportStar(require("./finance/unfreezePartner"), exports);
// Maintenance
__exportStar(require("./maintenance/updateMaintenanceStatus"), exports);
__exportStar(require("./maintenance/addMaintenanceUpdate"), exports);
// Backup
__exportStar(require("./backup/createSystemBackup"), exports);
__exportStar(require("./backup/restoreBackup"), exports);
// Scheduled functions
__exportStar(require("./scheduled/markOverdueInvoices"), exports);
__exportStar(require("./scheduled/expireInvitations"), exports);
__exportStar(require("./scheduled/paymentReminders"), exports);
__exportStar(require("./scheduled/maintenanceAlerts"), exports);
__exportStar(require("./scheduled/bookingReminders"), exports);
//# sourceMappingURL=index.js.map
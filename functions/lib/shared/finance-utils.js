"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitEqually = splitEqually;
exports.validateCustomSplits = validateCustomSplits;
exports.determineInvoiceStatus = determineInvoiceStatus;
exports.calculateOutstandingBalance = calculateOutstandingBalance;
/**
 * Splits a total charge equally among partners.
 * Handles rounding: remaining cents go to the first partner.
 */
function splitEqually(totalAmount, partnerIds) {
    if (partnerIds.length === 0)
        return [];
    const base = Math.floor((totalAmount / partnerIds.length) * 100) / 100;
    const total = base * partnerIds.length;
    const remainder = Math.round((totalAmount - total) * 100) / 100;
    return partnerIds.map((partnerId, index) => ({
        partnerId,
        amount: index === 0 ? base + remainder : base,
    }));
}
/**
 * Validates that custom splits sum to the total amount.
 */
function validateCustomSplits(splits, totalAmount) {
    const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    return Math.abs(splitTotal - totalAmount) < 0.01; // floating point tolerance
}
/**
 * Determines invoice status based on due date and payment.
 */
function determineInvoiceStatus(isPaid, dueDate) {
    if (isPaid)
        return 'paid';
    if (dueDate < new Date())
        return 'overdue';
    return 'pending';
}
/**
 * Calculates total outstanding balance for a partner across all invoices.
 */
function calculateOutstandingBalance(invoices) {
    return invoices
        .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.amount, 0);
}
//# sourceMappingURL=finance-utils.js.map
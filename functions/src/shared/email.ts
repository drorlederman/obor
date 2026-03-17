/**
 * Email sending via Firebase Trigger Email Extension.
 * Writes to the `mail` collection which the extension processes automatically.
 *
 * Setup: install firebase/firestore-send-email extension and configure SMTP.
 * https://firebase.google.com/products/extensions/firebase-firestore-send-email
 */
import { getFirestore } from 'firebase-admin/firestore'

interface EmailMessage {
  subject: string
  text: string
  html?: string
}

export async function sendEmail(to: string | string[], message: EmailMessage): Promise<void> {
  const db = getFirestore()
  const recipients = Array.isArray(to) ? to : [to]
  await db.collection('mail').add({
    to: recipients,
    message,
  })
}

export async function sendInvitationEmail(
  to: string,
  boatName: string,
  token: string,
): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'https://obor.app'
  const acceptUrl = `${appUrl}/join?token=${token}`

  await sendEmail(to, {
    subject: `הוזמנת להצטרף לסירה "${boatName}"`,
    text: [
      `שלום,`,
      ``,
      `הוזמנת להצטרף לניהול הסירה "${boatName}" במערכת OBOR.`,
      ``,
      `לאישור ההזמנה לחץ על הקישור:`,
      acceptUrl,
      ``,
      `ההזמנה תפוג בעוד 7 ימים.`,
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2>הוזמנת להצטרף לסירה "${boatName}"</h2>
        <p>שלום,</p>
        <p>הוזמנת להצטרף לניהול הסירה <strong>"${boatName}"</strong> במערכת OBOR.</p>
        <p>
          <a href="${acceptUrl}" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
            אשר הזמנה
          </a>
        </p>
        <p style="color:#666; font-size:13px;">ההזמנה תפוג בעוד 7 ימים.</p>
      </div>
    `,
  })
}

export async function sendPaymentReminderEmail(
  to: string,
  partnerName: string,
  boatName: string,
  totalOwed: number,
): Promise<void> {
  await sendEmail(to, {
    subject: `תזכורת תשלום — ${boatName}`,
    text: [
      `שלום ${partnerName},`,
      ``,
      `נותרה יתרה לתשלום של ₪${totalOwed.toFixed(2)} בסירה "${boatName}".`,
      `אנא כנס למערכת OBOR לתשלום.`,
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2>תזכורת תשלום — ${boatName}</h2>
        <p>שלום ${partnerName},</p>
        <p>נותרה יתרה לתשלום של <strong>₪${totalOwed.toFixed(2)}</strong> בסירה "${boatName}".</p>
        <p>אנא כנס למערכת OBOR לתשלום.</p>
      </div>
    `,
  })
}

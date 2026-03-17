/**
 * Initializes FCM for the current user and shows foreground notifications as toasts.
 * Call this once in an authenticated component (e.g., AppLayout).
 */
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { initFCM, onForegroundMessage } from '@/lib/fcm'

export function useFCM(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    initFCM(userId)
  }, [userId])

  useEffect(() => {
    const unsub = onForegroundMessage((title, body) => {
      toast(body ? `${title}: ${body}` : title, { duration: 5000 })
    })
    return unsub
  }, [])
}

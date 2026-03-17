/**
 * Real-time Firestore single-document subscription with React Query integration.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore'

export function useFirestoreDoc<T>(
  queryKey: QueryKey,
  docRef: DocumentReference | null,
  transform: (id: string, data: DocumentData) => T,
) {
  const queryClient = useQueryClient()
  const keyStr = JSON.stringify(queryKey)

  useEffect(() => {
    if (!docRef) return
    const unsub = onSnapshot(docRef, (snap) => {
      queryClient.setQueryData(
        JSON.parse(keyStr) as QueryKey,
        snap.exists() ? transform(snap.id, snap.data()) : null,
      )
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr])

  return useQuery<T | null>({
    queryKey: JSON.parse(keyStr) as QueryKey,
    queryFn: (): Promise<T | null> => {
      const cached = queryClient.getQueryData<T | null>(JSON.parse(keyStr) as QueryKey)
      if (cached !== undefined) return Promise.resolve(cached)
      if (!docRef) return Promise.resolve(null)
      return new Promise<T | null>((resolve, reject) => {
        const unsub = onSnapshot(
          docRef,
          (snap) => {
            unsub()
            resolve(snap.exists() ? transform(snap.id, snap.data()) : null)
          },
          reject,
        )
      })
    },
    enabled: docRef !== null,
    staleTime: Infinity,
  })
}

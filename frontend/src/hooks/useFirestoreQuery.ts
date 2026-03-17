/**
 * Real-time Firestore collection query with React Query integration.
 * Subscribes via onSnapshot and keeps the cache updated automatically.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore'

export function useFirestoreQuery<T>(
  queryKey: QueryKey,
  buildQuery: (() => Query) | null,
  transform: (id: string, data: DocumentData) => T,
) {
  const queryClient = useQueryClient()
  const keyStr = JSON.stringify(queryKey)

  useEffect(() => {
    if (!buildQuery) return
    const q = buildQuery()
    const unsub = onSnapshot(q, (snap) => {
      queryClient.setQueryData(
        JSON.parse(keyStr) as QueryKey,
        snap.docs.map((d) => transform(d.id, d.data())),
      )
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr])

  return useQuery<T[]>({
    queryKey: JSON.parse(keyStr) as QueryKey,
    queryFn: (): Promise<T[]> => {
      const cached = queryClient.getQueryData<T[]>(JSON.parse(keyStr) as QueryKey)
      if (cached !== undefined) return Promise.resolve(cached)
      if (!buildQuery) return Promise.resolve([])
      return new Promise<T[]>((resolve, reject) => {
        const q = buildQuery()
        const unsub = onSnapshot(
          q,
          (snap) => {
            unsub()
            resolve(snap.docs.map((d) => transform(d.id, d.data())))
          },
          reject,
        )
      })
    },
    enabled: buildQuery !== null,
    staleTime: Infinity,
  })
}

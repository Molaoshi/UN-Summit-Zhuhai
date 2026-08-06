// Stub tRPC provider — the backend graft will replace this file with the
// typed AppRouter version. Procedures used by the app:
//   trpc.room.join.mutate({ code, name })      -> { token, roomCode, ... }
//   trpc.room.create.mutate({ teacherName })   -> { token, roomCode, adminPin, ... }
import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'

// Untyped stub router: the backend graft replaces this with the real AppRouter type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCReact<any>() as any

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            const token = localStorage.getItem('summit:token')
            return token ? { authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    }),
  )
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

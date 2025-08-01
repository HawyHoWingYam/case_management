'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { API_CONFIG } from '@/lib/constants'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on 404s
              if (error?.response?.status === 404) return false
              // Don't retry on authentication errors
              if (error?.response?.status === 401) return false
              // Don't retry on permission errors
              if (error?.response?.status === 403) return false
              // Retry up to 3 times for other errors
              return failureCount < API_CONFIG.retryAttempts
            },
            retryDelay: (attemptIndex) => 
              Math.min(1000 * 2 ** attemptIndex, API_CONFIG.retryDelay * 10),
            refetchOnWindowFocus: false, // Disable automatic refetch on window focus
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on client errors (4xx)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false
              }
              // Retry mutations up to 2 times for server errors
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => 
              Math.min(1000 * 2 ** attemptIndex, API_CONFIG.retryDelay * 5),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}
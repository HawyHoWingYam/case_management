import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { HealthStatus } from '@/lib/types'
import { QUERY_KEYS } from '@/lib/constants'

export function useHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: () => apiClient.get<HealthStatus>('/health'),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 15000, // Consider data stale after 15 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  })
}

export function useDetailedHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.healthDetailed,
    queryFn: () => apiClient.get<HealthStatus>('/health/detailed'),
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 120000, // Keep in cache for 2 minutes
  })
}

// Hook for manual health checks
export function useHealthCheck() {
  const healthQuery = useHealth()
  const detailedHealthQuery = useDetailedHealth()

  const refetchAll = async () => {
    await Promise.all([
      healthQuery.refetch(),
      detailedHealthQuery.refetch()
    ])
  }

  return {
    basic: healthQuery,
    detailed: detailedHealthQuery,
    refetchAll,
    isLoading: healthQuery.isLoading || detailedHealthQuery.isLoading,
    hasError: healthQuery.isError || detailedHealthQuery.isError,
    isHealthy: healthQuery.data?.status === 'ok' && 
               detailedHealthQuery.data?.services?.database?.status === 'connected'
  }
}
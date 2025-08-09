'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface CaseLogEntry {
  log_id: number
  case_id: number
  user_id: number
  action: string
  details?: string
  created_at: string
  user?: {
    user_id: number
    username: string
  }
}

interface AddLogResponse {
  log_id: number
  message: string
}

// 使用react-query的自定义hook来处理案件日志
export function useCaseLogs(caseId: number) {
  const queryClient = useQueryClient()

  // 获取案件日志的query
  const logsQuery = useQuery({
    queryKey: ['case-logs', caseId],
    queryFn: async (): Promise<CaseLogEntry[]> => {
      console.log('📝 [useCaseLogs] Fetching logs for case:', caseId)
      const response = await api.cases.getCaseLogs(caseId)
      console.log('📝 [useCaseLogs] ✅ Logs fetch success, count:', response.data?.length || 0)
      if (response.data?.length > 0) {
        console.log('📝 [useCaseLogs] Latest log:', response.data[0])
      }
      return response.data || []
    },
    enabled: !!caseId, // 只有当caseId存在时才执行查询
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
    refetchOnWindowFocus: true, // 窗口获得焦点时重新获取
  })

  // 添加日志的mutation
  const addLogMutation = useMutation({
    mutationFn: async (logEntry: string): Promise<AddLogResponse> => {
      console.log('📝 [useCaseLogs] Adding log for case:', caseId, 'Content:', logEntry)
      const response = await api.cases.addCaseLog(caseId, logEntry)
      console.log('📝 [useCaseLogs] ✅ Add log success:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('📝 [useCaseLogs] Add log mutation success:', data)
      
      // 使日志查询缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['case-logs', caseId] })
      
      // 也使案件详情缓存失效，因为可能需要更新相关信息
      queryClient.invalidateQueries({ queryKey: ['case', caseId] })
      
      toast.success(data.message || '日志添加成功')
      console.log('📝 [useCaseLogs] Success toast shown and caches invalidated')
    },
    onError: (error: any) => {
      console.error('📝 [useCaseLogs] ❌ Add log error:', error)
      console.error('📝 [useCaseLogs] Error response:', error.response)
      const errorMessage = error.response?.data?.message || '添加日志失败'
      toast.error(errorMessage)
    }
  })

  // 手动刷新日志
  const refreshLogs = () => {
    console.log('📝 [useCaseLogs] Manually refreshing logs for case:', caseId)
    queryClient.invalidateQueries({ queryKey: ['case-logs', caseId] })
  }

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    error: logsQuery.error,
    addLog: addLogMutation.mutate,
    isAddingLog: addLogMutation.isPending,
    refreshLogs,
    // 提供重试功能
    refetch: logsQuery.refetch,
  }
}
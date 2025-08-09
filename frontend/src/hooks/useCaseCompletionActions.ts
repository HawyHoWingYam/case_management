'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Case } from '@/types/case'
import { toast } from 'sonner'

// 定义mutation的返回类型
interface CaseActionResponse {
  success: boolean
  message: string
  caseId: number
  newStatus: string
}

// 使用react-query的自定义hook来处理案件完成流程
export function useCaseCompletionActions() {
  const queryClient = useQueryClient()

  // 请求完成mutation
  const requestCompletionMutation = useMutation({
    mutationFn: async (caseId: number): Promise<CaseActionResponse> => {
      console.log('🔄 [useCaseCompletionActions] Requesting completion for case:', caseId)
      const response = await api.cases.requestCompletion(caseId)
      console.log('🔄 [useCaseCompletionActions] ✅ Request completion success:', response.data)
      return response.data
    },
    onSuccess: (data, caseId) => {
      console.log('🔄 [useCaseCompletionActions] Request completion mutation success:', data)
      
      // 更新案件详情的缓存
      queryClient.setQueryData(['case', caseId], (oldCase: Case | undefined) => {
        if (!oldCase) return oldCase
        console.log('🔄 [useCaseCompletionActions] Updating case cache with new status:', data.newStatus)
        return {
          ...oldCase,
          status: data.newStatus as any,
          updated_at: new Date().toISOString()
        }
      })
      
      // 使案件列表缓存失效以刷新列表
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      
      toast.success(data.message || '请求完成成功')
      console.log('🔄 [useCaseCompletionActions] Success toast and cache updates completed')
    },
    onError: (error: any) => {
      console.error('🔄 [useCaseCompletionActions] ❌ Request completion error:', error)
      const errorMessage = error.response?.data?.message || '请求完成失败'
      toast.error(errorMessage)
    }
  })

  // 批准完成mutation
  const approveCompletionMutation = useMutation({
    mutationFn: async (caseId: number): Promise<CaseActionResponse> => {
      console.log('🔄 [useCaseCompletionActions] Approving completion for case:', caseId)
      const response = await api.cases.approveCompletion(caseId)
      console.log('🔄 [useCaseCompletionActions] ✅ Approve completion success:', response.data)
      return response.data
    },
    onSuccess: (data, caseId) => {
      console.log('🔄 [useCaseCompletionActions] Approve completion mutation success:', data)
      
      // 更新案件详情的缓存
      queryClient.setQueryData(['case', caseId], (oldCase: Case | undefined) => {
        if (!oldCase) return oldCase
        console.log('🔄 [useCaseCompletionActions] Updating case cache with COMPLETED status')
        return {
          ...oldCase,
          status: data.newStatus as any,
          updated_at: new Date().toISOString(),
          metadata: {
            ...oldCase.metadata,
            completed_at: new Date().toISOString()
          }
        }
      })
      
      // 使案件列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      
      toast.success(data.message || '案件批准完成')
      console.log('🔄 [useCaseCompletionActions] Approval success toast and cache updates completed')
    },
    onError: (error: any) => {
      console.error('🔄 [useCaseCompletionActions] ❌ Approve completion error:', error)
      const errorMessage = error.response?.data?.message || '批准完成失败'
      toast.error(errorMessage)
    }
  })

  // 拒绝完成mutation
  const rejectCompletionMutation = useMutation({
    mutationFn: async (caseId: number): Promise<CaseActionResponse> => {
      console.log('🔄 [useCaseCompletionActions] Rejecting completion for case:', caseId)
      const response = await api.cases.rejectCompletion(caseId)
      console.log('🔄 [useCaseCompletionActions] ✅ Reject completion success:', response.data)
      return response.data
    },
    onSuccess: (data, caseId) => {
      console.log('🔄 [useCaseCompletionActions] Reject completion mutation success:', data)
      
      // 更新案件详情的缓存
      queryClient.setQueryData(['case', caseId], (oldCase: Case | undefined) => {
        if (!oldCase) return oldCase
        console.log('🔄 [useCaseCompletionActions] Updating case cache back to IN_PROGRESS status')
        return {
          ...oldCase,
          status: data.newStatus as any,
          updated_at: new Date().toISOString()
        }
      })
      
      // 使案件列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      
      toast.success(data.message || '案件完成请求已拒绝')
      console.log('🔄 [useCaseCompletionActions] Rejection success toast and cache updates completed')
    },
    onError: (error: any) => {
      console.error('🔄 [useCaseCompletionActions] ❌ Reject completion error:', error)
      const errorMessage = error.response?.data?.message || '拒绝完成失败'
      toast.error(errorMessage)
    }
  })

  return {
    requestCompletion: requestCompletionMutation.mutate,
    approveCompletion: approveCompletionMutation.mutate,
    rejectCompletion: rejectCompletionMutation.mutate,
    isRequesting: requestCompletionMutation.isPending,
    isApproving: approveCompletionMutation.isPending,
    isRejecting: rejectCompletionMutation.isPending,
    isLoading: requestCompletionMutation.isPending || approveCompletionMutation.isPending || rejectCompletionMutation.isPending
  }
}
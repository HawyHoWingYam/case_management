// frontend/src/hooks/useCaseActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { QUERY_KEYS, handleQueryError } from '@/lib/queryClient'
import { 
  Case, 
  CaseStatus, 
  CasePriority,
  UpdateCaseFormData 
} from '@/types/case'

// 案件状态更新
export function useUpdateCaseStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (params: { 
      id: number
      status: CaseStatus
      comment?: string 
    }): Promise<Case> => {
      const updateData: UpdateCaseFormData = {
        status: params.status,
        metadata: {
          statusChangeComment: params.comment,
          statusChangedBy: user?.user_id,
          statusChangedAt: new Date().toISOString(),
        }
      }
      
      const response = await apiClient.cases.update(params.id, updateData)
      return response.data
    },
    onSuccess: (updatedCase, variables) => {
      // 更新特定案件缓存
      queryClient.setQueryData(QUERY_KEYS.CASES.DETAIL(variables.id), updatedCase)
      
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD.STATS(user?.role || '') })
      
      // 根据状态显示不同的成功消息
      const statusMessages = {
        'OPEN': '案件已重新打开',
        'IN_PROGRESS': '案件状态已更新为进行中',
        'PENDING': '案件状态已更新为待处理',
        'RESOLVED': '案件已标记为已解决',
        'CLOSED': '案件已关闭',
      }
      
      toast.success(statusMessages[variables.status] || '案件状态更新成功')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`状态更新失败：${message}`)
    },
  })
}

// 案件优先级更新
export function useUpdateCasePriority() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (params: { 
      id: number
      priority: CasePriority
    }): Promise<Case> => {
      const updateData: UpdateCaseFormData = {
        priority: params.priority,
      }
      
      const response = await apiClient.cases.update(params.id, updateData)
      return response.data
    },
    onSuccess: (updatedCase, variables) => {
      queryClient.setQueryData(QUERY_KEYS.CASES.DETAIL(variables.id), updatedCase)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件优先级更新成功')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`优先级更新失败：${message}`)
    },
  })
}

// 案件分配
export function useAssignCase() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (params: { 
      id: number
      assignedTo: number | null
      comment?: string
    }): Promise<Case> => {
      const updateData: UpdateCaseFormData = {
        assigned_to_id: params.assignedTo,
        metadata: {
          assignmentComment: params.comment,
          assignedBy: user?.user_id,
          assignedAt: new Date().toISOString(),
        }
      }
      
      const response = await apiClient.cases.update(params.id, updateData)
      return response.data
    },
    onSuccess: (updatedCase, variables) => {
      queryClient.setQueryData(QUERY_KEYS.CASES.DETAIL(variables.id), updatedCase)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD.STATS(user?.role || '') })
      
      if (variables.assignedTo) {
        toast.success('案件分配成功')
      } else {
        toast.success('案件分配已取消')
      }
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`分配失败：${message}`)
    },
  })
}

// 批量操作案件
export function useBulkCaseActions() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (params: {
      action: 'assign' | 'updateStatus' | 'updatePriority' | 'delete'
      caseIds: number[]
      payload: any
    }) => {
      const { action, caseIds, payload } = params
      
      // 根据操作类型执行不同的批量操作
      switch (action) {
        case 'assign':
          return Promise.all(caseIds.map(id => 
            apiClient.cases.update(id, { assigned_to_id: payload.assignedTo })
          ))
          
        case 'updateStatus':
          return Promise.all(caseIds.map(id => 
            apiClient.cases.update(id, { status: payload.status })
          ))
          
        case 'updatePriority':
          return Promise.all(caseIds.map(id => 
            apiClient.cases.update(id, { priority: payload.priority })
          ))
          
        case 'delete':
          return Promise.all(caseIds.map(id => 
            apiClient.cases.delete(id)
          ))
          
        default:
          throw new Error('不支持的批量操作')
      }
    },
    onSuccess: (results, variables) => {
      // 无效化所有相关查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD.STATS(user?.role || '') })
      
      // 根据操作类型显示成功消息
      const actionMessages = {
        'assign': `成功分配 ${variables.caseIds.length} 个案件`,
        'updateStatus': `成功更新 ${variables.caseIds.length} 个案件状态`,
        'updatePriority': `成功更新 ${variables.caseIds.length} 个案件优先级`,
        'delete': `成功删除 ${variables.caseIds.length} 个案件`,
      }
      
      toast.success(actionMessages[variables.action])
    },
    onError: (error, variables) => {
      const message = handleQueryError(error)
      toast.error(`批量操作失败：${message}`)
    },
  })
}

// 复制案件
export function useDuplicateCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (originalCase: Case): Promise<Case> => {
      // 创建案件副本，去除一些不应该复制的字段
      const duplicateData = {
        title: `${originalCase.title} (副本)`,
        description: originalCase.description,
        priority: originalCase.priority,
        // 不复制: status, assigned_to, created_by, dates 等
      }
      
      const response = await apiClient.cases.create(duplicateData)
      return response.data
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件复制成功', {
        action: {
          label: '查看',
          onClick: () => router.push(`/cases/${newCase.id}`)
        }
      })
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`复制失败：${message}`)
    },
  })
}

// 案件归档
export function useArchiveCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { 
      id: number
      reason?: string 
    }): Promise<Case> => {
      const updateData: UpdateCaseFormData = {
        status: 'CLOSED', // 假设归档就是关闭状态
        metadata: {
          archived: true,
          archiveReason: params.reason,
          archivedAt: new Date().toISOString(),
        }
      }
      
      const response = await apiClient.cases.update(params.id, updateData)
      return response.data
    },
    onSuccess: (archivedCase, variables) => {
      queryClient.setQueryData(QUERY_KEYS.CASES.DETAIL(variables.id), archivedCase)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件已归档')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`归档失败：${message}`)
    },
  })
}

// 添加案件评论/日志
export function useAddCaseComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (params: {
      caseId: number
      comment: string
      isInternal?: boolean
    }) => {
      // 这里假设有添加评论的API，如果没有可以通过更新案件元数据实现
      const response = await apiClient.cases.addComment(params.caseId, {
        comment: params.comment,
        isInternal: params.isInternal || false,
        userId: user?.user_id,
      })
      return response.data
    },
    onSuccess: (result, variables) => {
      // 无效化案件详情查询，重新获取包含新评论的数据
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.CASES.DETAIL(variables.caseId) 
      })
      
      toast.success('评论添加成功')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`添加评论失败：${message}`)
    },
  })
}

// 案件操作的权限检查 hook
export function useCasePermissions(caseData?: Case) {
  const { user, hasRole } = useAuthStore()
  
  if (!user || !caseData) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      canChangeStatus: false,
      canChangePriority: false,
      canArchive: false,
      canComment: false,
    }
  }
  
  const isOwner = caseData.created_by_id === user.user_id
  const isAssignee = caseData.assigned_to_id === user.user_id
  const isAdmin = hasRole(['ADMIN'])
  const isManager = hasRole(['MANAGER'])
  
  return {
    canView: isAdmin || isManager || isOwner || isAssignee,
    canEdit: isAdmin || isManager || isOwner,
    canDelete: isAdmin || isOwner,
    canAssign: isAdmin || isManager,
    canChangeStatus: isAdmin || isManager || isAssignee,
    canChangePriority: isAdmin || isManager,
    canArchive: isAdmin || isManager,
    canComment: isAdmin || isManager || isOwner || isAssignee,
  }
}

// 导出便利的操作组合 hook
export function useCaseActions(caseId?: number, caseData?: Case) {
  const updateStatus = useUpdateCaseStatus()
  const updatePriority = useUpdateCasePriority()
  const assignCase = useAssignCase()
  const duplicateCase = useDuplicateCase()
  const archiveCase = useArchiveCase()
  const addComment = useAddCaseComment()
  const permissions = useCasePermissions(caseData)
  
  return {
    // 操作方法
    updateStatus: (status: CaseStatus, comment?: string) => 
      caseId ? updateStatus.mutate({ id: caseId, status, comment }) : undefined,
      
    updatePriority: (priority: CasePriority) => 
      caseId ? updatePriority.mutate({ id: caseId, priority }) : undefined,
      
    assign: (assignedTo: number | null, comment?: string) => 
      caseId ? assignCase.mutate({ id: caseId, assignedTo, comment }) : undefined,
      
    duplicate: () => 
      caseData ? duplicateCase.mutate(caseData) : undefined,
      
    archive: (reason?: string) => 
      caseId ? archiveCase.mutate({ id: caseId, reason }) : undefined,
      
    addComment: (comment: string, isInternal?: boolean) => 
      caseId ? addComment.mutate({ caseId, comment, isInternal }) : undefined,
    
    // 权限
    permissions,
    
    // 加载状态
    isLoading: updateStatus.isPending || updatePriority.isPending || 
               assignCase.isPending || duplicateCase.isPending || 
               archiveCase.isPending || addComment.isPending,
  }
}
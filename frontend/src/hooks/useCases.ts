// frontend/src/hooks/useCases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { QUERY_KEYS, handleQueryError } from '@/lib/queryClient'
import { 
  Case, 
  CaseQueryParams,
  CreateCaseRequest,
  UpdateCaseRequest,
  PaginatedResponse
} from '@/lib/api'

// 获取案件列表
export function useCases(queryParams: CaseQueryParams = {}) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.CASES.LIST(queryParams),
    queryFn: async (): Promise<PaginatedResponse<Case>> => {
      console.log('🔍 [useCases] Fetching cases with params:', queryParams)
      const response = await api.cases.getAll(queryParams)
      console.log('🔍 [useCases] Fetched cases:', response.data)
      return response.data
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分钟
    retry: (failureCount, error) => {
      // 如果是权限错误，不重试
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
  })
}

// 获取单个案件详情
export function useCase(id: number) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.CASES.DETAIL(id),
    queryFn: async (): Promise<Case> => {
      console.log('🔍 [useCase] Fetching case detail for ID:', id)
      const response = await api.cases.getById(id)
      console.log('🔍 [useCase] Fetched case:', response.data)
      return response.data
    },
    enabled: !!user && !!id,
    staleTime: 2 * 60 * 1000, // 2分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  })
}

// 根据视图获取案件
export function useCasesByView(view: string) {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.CASES.BY_VIEW(view, user?.user_id),
    queryFn: async (): Promise<PaginatedResponse<Case>> => {
      console.log('🔍 [useCasesByView] Fetching cases by view:', view)
      const response = await api.cases.getByView(view)
      console.log('🔍 [useCasesByView] Fetched cases:', response.data)
      return response.data
    },
    enabled: !!user && !!view,
    staleTime: 1 * 60 * 1000, // 1分钟
    gcTime: 5 * 60 * 1000, // 5分钟
  })
}

// 获取案件统计
export function useCaseStats(period: string = 'month') {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['cases', 'stats', period, user?.role],
    queryFn: async () => {
      console.log('🔍 [useCaseStats] Fetching case stats for period:', period)
      const response = await api.cases.getStats(period)
      console.log('🔍 [useCaseStats] Fetched stats:', response.data)
      return response.data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 15 * 60 * 1000, // 15分钟
  })
}

// 获取可指派的 Caseworker
export function useAvailableCaseworkers() {
  const { hasRole } = useAuthStore()
  
  return useQuery({
    queryKey: ['cases', 'available-caseworkers'],
    queryFn: async () => {
      console.log('🔍 [useAvailableCaseworkers] Fetching available caseworkers')
      const response = await api.cases.getAvailableCaseworkers()
      console.log('🔍 [useAvailableCaseworkers] Fetched caseworkers:', response.data)
      return response.data
    },
    enabled: hasRole(['ADMIN', 'MANAGER']),
    staleTime: 2 * 60 * 1000, // 2分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  })
}

// 创建案件
export function useCreateCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (data: CreateCaseRequest): Promise<Case> => {
      console.log('🔍 [useCreateCase] Creating case with data:', data)
      const response = await api.cases.create(data)
      console.log('🔍 [useCreateCase] Created case:', response.data)
      return response.data
    },
    onSuccess: (newCase) => {
      // 无效化案件列表查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      // 无效化统计查询
      queryClient.invalidateQueries({ queryKey: ['cases', 'stats'] })
      
      toast.success('案件创建成功！', {
        action: {
          label: '查看',
          onClick: () => router.push(`/cases/${newCase.id}`)
        }
      })
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`创建失败：${message}`)
    },
  })
}

// 更新案件
export function useUpdateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: { 
      id: number
      data: UpdateCaseRequest 
    }): Promise<Case> => {
      console.log('🔍 [useUpdateCase] Updating case:', params)
      const response = await api.cases.update(params.id, params.data)
      console.log('🔍 [useUpdateCase] Updated case:', response.data)
      return response.data
    },
    onSuccess: (updatedCase, variables) => {
      // 更新特定案件缓存
      queryClient.setQueryData(QUERY_KEYS.CASES.DETAIL(variables.id), updatedCase)
      
      // 无效化案件列表查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件更新成功！')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`更新失败：${message}`)
    },
  })
}

// 删除案件
export function useDeleteCase() {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      console.log('🔍 [useDeleteCase] Deleting case:', id)
      const response = await api.cases.delete(id)
      console.log('🔍 [useDeleteCase] Deleted case:', response.data)
      return response.data
    },
    onSuccess: (result, caseId) => {
      // 移除特定案件缓存
      queryClient.removeQueries({ queryKey: QUERY_KEYS.CASES.DETAIL(caseId) })
      
      // 无效化案件列表查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件删除成功！')
      router.push('/cases')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`删除失败：${message}`)
    },
  })
}

// 指派案件
export function useAssignCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      id: number
      assignedCaseworkerId: number
    }) => {
      console.log('🔍 [useAssignCase] Assigning case:', params)
      const response = await api.cases.assignCase(params.id, params.assignedCaseworkerId)
      console.log('🔍 [useAssignCase] Assignment result:', response.data)
      return response.data
    },
    onSuccess: (result, variables) => {
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.DETAIL(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      queryClient.invalidateQueries({ queryKey: ['cases', 'available-caseworkers'] })
      
      toast.success('案件指派成功！')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`指派失败：${message}`)
    },
  })
}

// 接受案件
export function useAcceptCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🔍 [useAcceptCase] Accepting case:', id)
      const response = await api.cases.acceptCase(id)
      console.log('🔍 [useAcceptCase] Accept result:', response.data)
      return response.data
    },
    onSuccess: (result, caseId) => {
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.DETAIL(caseId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      
      toast.success('案件接受成功！')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`接受失败：${message}`)
    },
  })
}

// 拒绝案件
export function useRejectCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('🔍 [useRejectCase] Rejecting case:', id)
      const response = await api.cases.rejectCase(id)
      console.log('🔍 [useRejectCase] Reject result:', response.data)
      return response.data
    },
    onSuccess: (result, caseId) => {
      // 无效化相关查询
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.DETAIL(caseId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL })
      queryClient.invalidateQueries({ queryKey: ['cases', 'available-caseworkers'] })
      
      toast.success('案件拒绝成功！')
    },
    onError: (error) => {
      const message = handleQueryError(error)
      toast.error(`拒绝失败：${message}`)
    },
  })
}

// 便利的案件操作Hook - 组合多个操作
export function useCaseOperations(caseId?: number) {
  const assignCase = useAssignCase()
  const acceptCase = useAcceptCase()
  const rejectCase = useRejectCase()
  const updateCase = useUpdateCase()
  const deleteCase = useDeleteCase()
  
  return {
    // 操作方法
    assign: (assignedCaseworkerId: number) =>
      caseId ? assignCase.mutate({ id: caseId, assignedCaseworkerId }) : undefined,
      
    accept: () =>
      caseId ? acceptCase.mutate(caseId) : undefined,
      
    reject: () =>
      caseId ? rejectCase.mutate(caseId) : undefined,
      
    update: (data: UpdateCaseRequest) =>
      caseId ? updateCase.mutate({ id: caseId, data }) : undefined,
      
    delete: () =>
      caseId ? deleteCase.mutate(caseId) : undefined,
    
    // 加载状态
    isLoading: assignCase.isPending || acceptCase.isPending || 
               rejectCase.isPending || updateCase.isPending || 
               deleteCase.isPending,
  }
}
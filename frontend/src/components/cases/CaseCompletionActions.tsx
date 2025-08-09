'use client'

import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { Case } from '@/types/case'
import { cn } from '@/lib/utils'
import { useCaseCompletionActions } from '@/hooks/useCaseCompletionActions'

interface CaseCompletionActionsProps {
  caseData: Case
  onCaseUpdate: (updatedCase: Case) => void
  className?: string
}

export function CaseCompletionActions({ caseData, onCaseUpdate, className }: CaseCompletionActionsProps) {
  const { user, hasRole } = useAuthStore()
  const {
    requestCompletion,
    approveCompletion,
    rejectCompletion,
    isRequesting,
    isApproving,
    isRejecting,
    isLoading
  } = useCaseCompletionActions()

  console.log('🔄 [CaseCompletionActions] Rendering with case status:', caseData.status)
  console.log('🔄 [CaseCompletionActions] Current user role:', user?.role)
  console.log('🔄 [CaseCompletionActions] User ID:', user?.user_id)
  console.log('🔄 [CaseCompletionActions] Case assigned to:', caseData.assigned_to_id)
  console.log('🔄 [CaseCompletionActions] Loading states:', { isRequesting, isApproving, isRejecting, isLoading })

  // 处理Caseworker请求完成
  const handleRequestCompletion = async () => {
    console.log('🔄 [CaseCompletionActions] Handle request completion triggered')
    console.log('🔄 [CaseCompletionActions] Case ID:', caseData.id)
    console.log('🔄 [CaseCompletionActions] Current case status:', caseData.status)
    
    requestCompletion(caseData.id)
    
    // 更新本地状态（react-query会处理缓存，但为了即时UI反馈）
    const updatedCase = {
      ...caseData,
      status: 'PENDING_COMPLETION_REVIEW' as const,
      updated_at: new Date().toISOString()
    }
    console.log('🔄 [CaseCompletionActions] Updating local case data via callback:', updatedCase)
    onCaseUpdate(updatedCase)
  }

  // 处理Chair批准完成
  const handleApproveCompletion = async () => {
    console.log('🔄 [CaseCompletionActions] Handle approve completion triggered')
    console.log('🔄 [CaseCompletionActions] Case ID:', caseData.id)
    
    approveCompletion(caseData.id)
    
    // 更新本地状态
    const updatedCase = {
      ...caseData,
      status: 'COMPLETED' as const,
      updated_at: new Date().toISOString(),
      metadata: {
        ...caseData.metadata,
        completed_at: new Date().toISOString(),
        completed_by: user?.user_id
      }
    }
    console.log('🔄 [CaseCompletionActions] Updating local case data via callback:', updatedCase)
    onCaseUpdate(updatedCase)
  }

  // 处理Chair拒绝完成
  const handleRejectCompletion = async () => {
    console.log('🔄 [CaseCompletionActions] Handle reject completion triggered')
    console.log('🔄 [CaseCompletionActions] Case ID:', caseData.id)
    
    if (!window.confirm('确定要拒绝此案件完成请求吗？案件将回到进行中状态。')) {
      console.log('🔄 [CaseCompletionActions] User cancelled rejection')
      return
    }

    console.log('🔄 [CaseCompletionActions] User confirmed rejection, proceeding...')
    rejectCompletion(caseData.id)
    
    // 更新本地状态
    const updatedCase = {
      ...caseData,
      status: 'IN_PROGRESS' as const,
      updated_at: new Date().toISOString()
    }
    console.log('🔄 [CaseCompletionActions] Updating local case data via callback:', updatedCase)
    onCaseUpdate(updatedCase)
  }

  // 检查是否显示Caseworker请求完成按钮
  const shouldShowRequestCompletion = () => {
    return (
      hasRole(['USER']) && // 只有Caseworker(USER角色)可以请求完成
      caseData.assigned_to_id === user?.user_id && // 必须是指派给当前用户的案件
      caseData.status === 'IN_PROGRESS' // 只有进行中的案件可以请求完成
    )
  }

  // 检查是否显示Chair审批按钮
  const shouldShowApprovalActions = () => {
    return (
      hasRole(['ADMIN', 'MANAGER']) && // 只有Chair(ADMIN/MANAGER角色)可以审批
      caseData.status === 'PENDING_COMPLETION_REVIEW' // 只有待审批的案件可以审批
    )
  }

  // 检查是否显示状态提示
  const shouldShowStatusAlert = () => {
    return caseData.status === 'PENDING_COMPLETION_REVIEW' || caseData.status === 'COMPLETED'
  }

  console.log('🔄 [CaseCompletionActions] Should show request completion:', shouldShowRequestCompletion())
  console.log('🔄 [CaseCompletionActions] Should show approval actions:', shouldShowApprovalActions())
  console.log('🔄 [CaseCompletionActions] Should show status alert:', shouldShowStatusAlert())

  // 如果没有任何操作需要显示，则不渲染组件
  if (!shouldShowRequestCompletion() && !shouldShowApprovalActions() && !shouldShowStatusAlert()) {
    console.log('🔄 [CaseCompletionActions] No actions to show, not rendering')
    return null
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>案件完成流程</span>
        </CardTitle>
        <CardDescription>
          管理案件的完成请求和审批流程
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态提示 */}
        {shouldShowStatusAlert() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {caseData.status === 'PENDING_COMPLETION_REVIEW' && (
                <>
                  此案件已请求完成，正在等待 Chair 审批。
                  {hasRole(['USER']) && caseData.assigned_to_id === user?.user_id && (
                    <> 请耐心等待管理员审批结果。</>
                  )}
                </>
              )}
              {caseData.status === 'COMPLETED' && (
                <>
                  此案件已完成。
                  {caseData.metadata?.completed_at && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      完成时间: {new Date(caseData.metadata.completed_at).toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Caseworker 请求完成按钮 */}
        {shouldShowRequestCompletion() && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
            <div>
              <h4 className="font-medium text-blue-900">请求完成案件</h4>
              <p className="text-sm text-blue-700 mt-1">
                如果您已完成此案件的所有工作，可以请求 Chair 进行最终审批
              </p>
            </div>
            <Button
              onClick={handleRequestCompletion}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRequesting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              请求完成
            </Button>
          </div>
        )}

        {/* Chair 审批操作 */}
        {shouldShowApprovalActions() && (
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 rounded-lg border">
              <h4 className="font-medium text-yellow-900 mb-2">审批案件完成请求</h4>
              <p className="text-sm text-yellow-700 mb-4">
                Caseworker 已请求完成此案件，请审查案件内容并决定是否批准完成。
              </p>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleApproveCompletion}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  批准完成
                </Button>
                
                <Button
                  onClick={handleRejectCompletion}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {isRejecting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  拒绝完成
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
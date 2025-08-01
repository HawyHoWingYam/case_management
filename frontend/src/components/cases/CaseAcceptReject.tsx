'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

import { Case } from '@/types/case'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

interface CaseAcceptRejectProps {
  caseData: Case
  onCaseUpdate: (updatedCase: Case) => void
  className?: string
}

export function CaseAcceptReject({
  caseData,
  onCaseUpdate,
  className
}: CaseAcceptRejectProps) {
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { user, hasRole } = useAuthStore()

  // 检查当前用户是否可以执行 accept/reject 操作
  const canAcceptReject = () => {
    // DEBUG: Add comprehensive logging to understand why Accept/Reject buttons aren't showing
    console.log('🔍 [CaseAcceptReject] DEBUG: Checking canAcceptReject conditions')
    console.log('🔍 [CaseAcceptReject] Current user:', user)
    console.log('🔍 [CaseAcceptReject] user?.user_id:', user?.user_id, 'type:', typeof user?.user_id)
    console.log('🔍 [CaseAcceptReject] user?.role:', user?.role)
    console.log('🔍 [CaseAcceptReject] hasRole([\'USER\']):', hasRole(['USER']))
    console.log('🔍 [CaseAcceptReject] caseData.assigned_to_id:', caseData.assigned_to_id, 'type:', typeof caseData.assigned_to_id)
    console.log('🔍 [CaseAcceptReject] caseData.assigned_to:', caseData.assigned_to)
    console.log('🔍 [CaseAcceptReject] caseData.status:', caseData.status)
    console.log('🔍 [CaseAcceptReject] Assignment match:', caseData.assigned_to_id === user?.user_id)
    console.log('🔍 [CaseAcceptReject] Status is PENDING:', caseData.status === 'PENDING')
    
    const hasUserRole = hasRole(['USER'])
    const isAssignedToUser = caseData.assigned_to_id === user?.user_id
    const isPendingStatus = caseData.status === 'PENDING'
    
    console.log('🔍 [CaseAcceptReject] Condition results:')
    console.log('🔍 [CaseAcceptReject] - hasUserRole:', hasUserRole)
    console.log('🔍 [CaseAcceptReject] - isAssignedToUser:', isAssignedToUser)
    console.log('🔍 [CaseAcceptReject] - isPendingStatus:', isPendingStatus)
    
    const canAccept = hasUserRole && isAssignedToUser && isPendingStatus
    console.log('🔍 [CaseAcceptReject] Final canAcceptReject result:', canAccept)
    
    // 只有 USER 角色且案件指派给当前用户且状态为 PENDING 才能执行操作
    return canAccept
  }

  // 处理接受案件
  const handleAcceptCase = async () => {
    if (!caseData.id) {
      toast.error('案件ID无效')
      return
    }

    setIsAccepting(true)
    try {
      const response = await apiClient.cases.acceptCase(caseData.id)
      
      // 更新案件状态
      const updatedCase = {
        ...caseData,
        status: 'IN_PROGRESS' as const,
        updated_at: new Date().toISOString()
      }
      
      onCaseUpdate(updatedCase)
      setIsAcceptDialogOpen(false)
      
      toast.success('案件接受成功！案件状态已更新为进行中')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '接受案件失败'
      toast.error(errorMessage)
      console.error('Accept case error:', error)
    } finally {
      setIsAccepting(false)
    }
  }

  // 处理拒绝案件
  const handleRejectCase = async () => {
    if (!caseData.id) {
      toast.error('案件ID无效')
      return
    }

    setIsRejecting(true)
    try {
      const response = await apiClient.cases.rejectCase(caseData.id)
      
      // 更新案件状态
      const updatedCase = {
        ...caseData,
        status: 'OPEN' as const,
        assigned_to_id: null,
        assigned_to: null,
        updated_at: new Date().toISOString()
      }
      
      onCaseUpdate(updatedCase)
      setIsRejectDialogOpen(false)
      
      toast.success('案件拒绝成功！案件已回到待指派状态')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '拒绝案件失败'
      toast.error(errorMessage)
      console.error('Reject case error:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  // 如果不能执行操作，不显示组件
  if (!canAcceptReject()) {
    return null
  }

  return (
    <div className={className}>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Clock className="h-5 w-5 mr-2" />
            待处理案件
          </CardTitle>
          <CardDescription className="text-orange-700">
            此案件已指派给您，请选择接受或拒绝处理
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>案件详情：</strong>{caseData.title}
              <br />
              <strong>优先级：</strong>
              <Badge variant={
                caseData.priority === 'URGENT' ? 'destructive' :
                caseData.priority === 'HIGH' ? 'destructive' :
                caseData.priority === 'MEDIUM' ? 'default' : 'secondary'
              }>
                {caseData.priority === 'URGENT' ? '紧急' :
                 caseData.priority === 'HIGH' ? '高' :
                 caseData.priority === 'MEDIUM' ? '中' : '低'}
              </Badge>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            {/* 接受案件 */}
            <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" disabled={isAccepting || isRejecting}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  接受案件
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    确认接受案件
                  </DialogTitle>
                  <DialogDescription>
                    您确定要接受此案件吗？接受后案件状态将变更为"进行中"，您需要负责处理此案件。
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{caseData.title}</h4>
                    {caseData.description && (
                      <p className="text-sm text-gray-600 mt-1">{caseData.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">优先级: {caseData.priority}</Badge>
                      {caseData.due_date && (
                        <Badge variant="outline">
                          截止日期: {new Date(caseData.due_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAcceptDialogOpen(false)}
                      disabled={isAccepting}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleAcceptCase}
                      disabled={isAccepting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isAccepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          接受中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          确认接受
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 拒绝案件 */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" disabled={isAccepting || isRejecting}>
                  <XCircle className="h-4 w-4 mr-2" />
                  拒绝案件
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-800">
                    <XCircle className="h-5 w-5 mr-2" />
                    确认拒绝案件
                  </DialogTitle>
                  <DialogDescription>
                    您确定要拒绝此案件吗？拒绝后案件将回到"开放"状态，等待重新指派给其他处理人员。
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{caseData.title}</h4>
                    {caseData.description && (
                      <p className="text-sm text-gray-600 mt-1">{caseData.description}</p>
                    )}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      拒绝案件后，管理员需要重新分配此案件给其他处理人员。
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectDialogOpen(false)}
                      disabled={isRejecting}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectCase}
                      disabled={isRejecting}
                    >
                      {isRejecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          拒绝中...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          确认拒绝
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
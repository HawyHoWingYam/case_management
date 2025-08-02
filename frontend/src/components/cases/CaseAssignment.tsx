// frontend/src/components/cases/CaseAssignment.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  User, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Clock,
  Target
} from 'lucide-react'

import { Case } from '@/types/case'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface CaseAssignmentProps {
  caseData: Case
  onCaseUpdate: (updatedCase: Case) => void
  className?: string
}

// 可指派用户类型
interface AvailableCaseworker {
  user_id: number
  username: string
  email: string
  activeCases: number
  canAcceptMore: boolean
}

export function CaseAssignment({
  caseData,
  onCaseUpdate,
  className
}: CaseAssignmentProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedCaseworker, setSelectedCaseworker] = useState<string>('')
  const [assignmentComment, setAssignmentComment] = useState('')
  const [availableCaseworkers, setAvailableCaseworkers] = useState<AvailableCaseworker[]>([])
  const [loadingCaseworkers, setLoadingCaseworkers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, hasRole } = useAuthStore()

  // 检查当前用户是否可以执行指派操作
  const canAssignCase = () => {
    console.log('🔍 [CaseAssignment] DEBUG: Checking canAssignCase conditions')
    console.log('🔍 [CaseAssignment] Current user:', user)
    console.log('🔍 [CaseAssignment] user?.role:', user?.role)
    console.log('🔍 [CaseAssignment] hasRole([\'ADMIN\', \'MANAGER\']):', hasRole(['ADMIN', 'MANAGER']))
    console.log('🔍 [CaseAssignment] caseData.status:', caseData.status)
    console.log('🔍 [CaseAssignment] Status is OPEN:', caseData.status === 'OPEN')
    
    const hasPermission = hasRole(['ADMIN', 'MANAGER'])
    const isOpenStatus = caseData.status === 'OPEN'
    
    console.log('🔍 [CaseAssignment] Condition results:')
    console.log('🔍 [CaseAssignment] - hasPermission:', hasPermission)
    console.log('🔍 [CaseAssignment] - isOpenStatus:', isOpenStatus)
    
    const canAssign = hasPermission && isOpenStatus
    console.log('🔍 [CaseAssignment] Final canAssignCase result:', canAssign)
    
    // 只有 ADMIN/MANAGER 角色且案件状态为 OPEN 才能执行指派
    return canAssign
  }

  // 获取可指派的 Caseworker 列表
  const fetchAvailableCaseworkers = async () => {
    setLoadingCaseworkers(true)
    setError(null)
    
    try {
      console.log('🔍 [CaseAssignment] Fetching available caseworkers...')
      const response = await api.cases.getAvailableCaseworkers()
      console.log('🔍 [CaseAssignment] Available caseworkers:', response.data)
      
      setAvailableCaseworkers(response.data)
    } catch (error: any) {
      console.error('🔍 [CaseAssignment] Failed to fetch caseworkers:', error)
      const errorMessage = error.response?.data?.message || '获取可指派用户失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingCaseworkers(false)
    }
  }

  // 当对话框打开时获取可指派用户列表
  useEffect(() => {
    if (isAssignDialogOpen && availableCaseworkers.length === 0) {
      fetchAvailableCaseworkers()
    }
  }, [isAssignDialogOpen])

  // 处理指派案件
  const handleAssignCase = async () => {
    if (!selectedCaseworker || !caseData.id) {
      toast.error('请选择要指派的用户')
      return
    }

    const assignedCaseworkerId = parseInt(selectedCaseworker, 10)
    if (isNaN(assignedCaseworkerId)) {
      toast.error('用户ID无效')
      return
    }

    setIsAssigning(true)
    setError(null)
    
    try {
      console.log('🔍 [CaseAssignment] Assigning case:', {
        caseId: caseData.id,
        assignedCaseworkerId,
        comment: assignmentComment
      })
      
      const response = await api.cases.assignCase(caseData.id, assignedCaseworkerId)
      console.log('🔍 [CaseAssignment] Assignment response:', response.data)
      
      // 更新案件状态
      const selectedUser = availableCaseworkers.find(cw => cw.user_id === assignedCaseworkerId)
      const updatedCase = {
        ...caseData,
        status: 'PENDING' as const,
        assigned_to_id: assignedCaseworkerId,
        assigned_to: selectedUser ? {
          user_id: selectedUser.user_id,
          username: selectedUser.username,
          email: selectedUser.email
        } : undefined,
        updated_at: new Date().toISOString()
      }
      
      onCaseUpdate(updatedCase)
      setIsAssignDialogOpen(false)
      setSelectedCaseworker('')
      setAssignmentComment('')
      
      toast.success(`案件已成功指派给 ${selectedUser?.username}`)
    } catch (error: any) {
      console.error('🔍 [CaseAssignment] Assignment error:', error)
      const errorMessage = error.response?.data?.message || '指派案件失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  // 如果不能执行指派操作，不显示组件
  if (!canAssignCase()) {
    return null
  }

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Target className="h-5 w-5 mr-2" />
            案件指派
          </CardTitle>
          <CardDescription className="text-blue-700">
            此案件状态为开放，可以指派给团队成员处理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 当前状态信息 */}
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>案件详情：</strong>{caseData.title}
              <br />
              <strong>当前状态：</strong>
              <Badge variant="outline" className="ml-1">
                {caseData.status === 'OPEN' ? '待指派' : caseData.status}
              </Badge>
              <br />
              <strong>优先级：</strong>
              <Badge variant={
                caseData.priority === 'URGENT' ? 'destructive' :
                caseData.priority === 'HIGH' ? 'destructive' :
                caseData.priority === 'MEDIUM' ? 'default' : 'secondary'
              } className="ml-1">
                {caseData.priority === 'URGENT' ? '紧急' :
                 caseData.priority === 'HIGH' ? '高' :
                 caseData.priority === 'MEDIUM' ? '中' : '低'}
              </Badge>
            </AlertDescription>
          </Alert>

          {/* 指派按钮 */}
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={isAssigning}>
                <UserPlus className="h-4 w-4 mr-2" />
                指派案件
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center text-blue-800">
                  <UserPlus className="h-5 w-5 mr-2" />
                  指派案件给团队成员
                </DialogTitle>
                <DialogDescription>
                  选择合适的团队成员来处理此案件。指派后案件状态将变更为"待接受"。
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* 错误提示 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 案件信息 */}
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

                {/* 选择指派用户 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">指派给</label>
                  <Select 
                    value={selectedCaseworker} 
                    onValueChange={setSelectedCaseworker}
                    disabled={loadingCaseworkers || isAssigning}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingCaseworkers ? "加载中..." : "选择团队成员"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCaseworkers ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>加载中...</span>
                          </div>
                        </SelectItem>
                      ) : availableCaseworkers.length === 0 ? (
                        <SelectItem value="no-users" disabled>
                          暂无可指派的用户
                        </SelectItem>
                      ) : (
                        availableCaseworkers.map((caseworker) => (
                          <SelectItem key={caseworker.user_id} value={caseworker.user_id.toString()}>
                            <div className="flex items-center space-x-2 w-full">
                              <User className="h-3 w-3" />
                              <span>{caseworker.username}</span>
                              <span className="text-xs text-muted-foreground">
                                ({caseworker.email})
                              </span>
                              {!caseworker.canAcceptMore && (
                                <Badge variant="secondary" className="text-xs">满载</Badge>
                              )}
                              {caseworker.activeCases > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {caseworker.activeCases}个案件
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableCaseworkers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      显示 {availableCaseworkers.filter(cw => cw.canAcceptMore).length} 个可用，
                      {availableCaseworkers.filter(cw => !cw.canAcceptMore).length} 个已满载
                    </p>
                  )}
                </div>
                
                {/* 指派说明 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">指派说明 (可选)</label>
                  <Textarea
                    placeholder="添加指派说明或特殊要求..."
                    value={assignmentComment}
                    onChange={(e) => setAssignmentComment(e.target.value)}
                    rows={3}
                    disabled={isAssigning}
                  />
                </div>
                
                {/* 操作按钮 */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAssignDialogOpen(false)
                      setSelectedCaseworker('')
                      setAssignmentComment('')
                      setError(null)
                    }}
                    disabled={isAssigning}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleAssignCase}
                    disabled={!selectedCaseworker || isAssigning || loadingCaseworkers}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        指派中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        确认指派
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
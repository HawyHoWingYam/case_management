// frontend/src/components/cases/CaseActions.tsx
'use client'

import React, { useState } from 'react'
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
import { 
  PlayCircle, 
  Pause, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  Flag,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'

import { Case, CaseStatus, CasePriority } from '@/types/case'
import { CASE_STATUS_CONFIG, CASE_PRIORITY_CONFIG } from '@/types/case'

interface CaseActionsProps {
  caseData: Case
  permissions: {
    canChangeStatus: boolean
    canChangePriority: boolean
    canAssign: boolean
    canComment: boolean
  }
  onStatusChange: (status: CaseStatus, comment?: string) => void
  onPriorityChange: (priority: CasePriority) => void
  onAssign: (userId: number | null, comment?: string) => void
  isLoading?: boolean
}

export function CaseActions({
  caseData,
  permissions,
  onStatusChange,
  onPriorityChange,
  onAssign,
  isLoading = false,
}: CaseActionsProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>(caseData.status)
  const [selectedPriority, setSelectedPriority] = useState<CasePriority>(caseData.priority)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [actionComment, setActionComment] = useState('')

  // 模拟用户列表（实际应用中应该从API获取）
  const mockUsers = [
    { id: 1, username: 'john_doe', email: 'john@example.com' },
    { id: 2, username: 'jane_smith', email: 'jane@example.com' },
    { id: 3, username: 'admin', email: 'admin@example.com' },
  ]

  // 获取状态变更的快速操作
  const getStatusActions = () => {
    const actions = []
    const currentStatus = caseData.status

    switch (currentStatus) {
      case 'OPEN':
        actions.push({
          status: 'IN_PROGRESS' as CaseStatus,
          label: '开始处理',
          icon: PlayCircle,
          variant: 'default' as const,
          description: '将案件状态更改为进行中',
        })
        actions.push({
          status: 'PENDING' as CaseStatus,
          label: '暂停处理',
          icon: Pause,
          variant: 'secondary' as const,
          description: '暂时挂起案件处理',
        })
        break

      case 'IN_PROGRESS':
        actions.push({
          status: 'RESOLVED' as CaseStatus,
          label: '标记已解决',
          icon: CheckCircle,
          variant: 'default' as const,
          description: '案件问题已解决',
        })
        actions.push({
          status: 'PENDING' as CaseStatus,
          label: '暂停处理',
          icon: Pause,
          variant: 'secondary' as const,
          description: '暂时挂起案件处理',
        })
        break

      case 'PENDING':
        actions.push({
          status: 'IN_PROGRESS' as CaseStatus,
          label: '恢复处理',
          icon: PlayCircle,
          variant: 'default' as const,
          description: '继续处理案件',
        })
        actions.push({
          status: 'CLOSED' as CaseStatus,
          label: '关闭案件',
          icon: XCircle,
          variant: 'destructive' as const,
          description: '关闭案件（无需解决）',
        })
        break

      case 'RESOLVED':
        actions.push({
          status: 'CLOSED' as CaseStatus,
          label: '确认关闭',
          icon: CheckCircle,
          variant: 'default' as const,
          description: '确认案件已解决并关闭',
        })
        actions.push({
          status: 'IN_PROGRESS' as CaseStatus,
          label: '重新打开',
          icon: PlayCircle,
          variant: 'outline' as const,
          description: '重新打开案件继续处理',
        })
        break

      case 'CLOSED':
        actions.push({
          status: 'OPEN' as CaseStatus,
          label: '重新打开',
          icon: PlayCircle,
          variant: 'outline' as const,
          description: '重新打开案件',
        })
        break
    }

    return actions
  }

  // 获取优先级变更的快速操作
  const getPriorityActions = () => {
    const currentPriority = caseData.priority
    const actions = []

    if (currentPriority !== 'URGENT') {
      actions.push({
        priority: 'URGENT' as CasePriority,
        label: '标记紧急',
        icon: AlertTriangle,
        variant: 'destructive' as const,
        description: '将优先级提升为紧急',
      })
    }

    if (currentPriority !== 'HIGH') {
      actions.push({
        priority: 'HIGH' as CasePriority,
        label: '高优先级',
        icon: Flag,
        variant: 'default' as const,
        description: '设置为高优先级',
      })
    }

    if (currentPriority !== 'MEDIUM') {
      actions.push({
        priority: 'MEDIUM' as CasePriority,
        label: '中等优先级',
        icon: Flag,
        variant: 'secondary' as const,
        description: '设置为中等优先级',
      })
    }

    if (currentPriority !== 'LOW') {
      actions.push({
        priority: 'LOW' as CasePriority,
        label: '低优先级',
        icon: Flag,
        variant: 'outline' as const,
        description: '设置为低优先级',
      })
    }

    return actions
  }

  // 处理状态变更
  const handleStatusChange = (status: CaseStatus, requireComment: boolean = false) => {
    if (requireComment) {
      setSelectedStatus(status)
      setIsStatusDialogOpen(true)
    } else {
      onStatusChange(status)
    }
  }

  // 处理优先级变更
  const handlePriorityChange = (priority: CasePriority) => {
    onPriorityChange(priority)
  }

  // 确认状态变更
  const confirmStatusChange = () => {
    onStatusChange(selectedStatus, actionComment)
    setActionComment('')
    setIsStatusDialogOpen(false)
  }

  // 确认指派变更
  const confirmAssign = () => {
    const userId = selectedAssignee === 'unassigned' ? null : parseInt(selectedAssignee, 10)
    onAssign(userId, actionComment)
    setActionComment('')
    setSelectedAssignee('')
    setIsAssignDialogOpen(false)
  }

  const statusActions = getStatusActions()
  const priorityActions = getPriorityActions()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 状态操作 */}
      {permissions.canChangeStatus && statusActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">状态操作</CardTitle>
            <CardDescription>
              当前状态: <Badge>{CASE_STATUS_CONFIG[caseData.status]?.label}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleStatusChange(action.status, true)}
                  disabled={isLoading}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 优先级操作 */}
      {permissions.canChangePriority && priorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">优先级操作</CardTitle>
            <CardDescription>
              当前优先级: <Badge>{CASE_PRIORITY_CONFIG[caseData.priority]?.label}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.priority}
                  variant={action.variant}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handlePriorityChange(action.priority)}
                  disabled={isLoading}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 指派操作 */}
      {permissions.canAssign && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">指派操作</CardTitle>
            <CardDescription>
              当前指派: {caseData.assigned_to?.username || '未指派'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {caseData.assigned_to ? '重新指派' : '指派案件'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>指派案件</DialogTitle>
                  <DialogDescription>
                    选择要指派的用户，或取消当前指派
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">指派给</label>
                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择用户" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">取消指派</SelectItem>
                        {mockUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">备注 (可选)</label>
                    <Textarea
                      placeholder="添加指派说明..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={confirmAssign}
                      disabled={!selectedAssignee || isLoading}
                    >
                      确认指派
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* 状态变更确认对话框 */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认状态变更</DialogTitle>
            <DialogDescription>
              将案件状态从 "{CASE_STATUS_CONFIG[caseData.status]?.label}" 
              更改为 "{CASE_STATUS_CONFIG[selectedStatus]?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">变更说明 (可选)</label>
              <Textarea
                placeholder="请说明状态变更的原因..."
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={confirmStatusChange}
                disabled={isLoading}
              >
                确认变更
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
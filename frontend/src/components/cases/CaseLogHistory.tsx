'use client'

import React, { useState } from 'react'
import { History, User, Clock, MessageCircle, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { Case } from '@/types/case'
import { cn } from '@/lib/utils'
import { useCaseLogs } from '@/hooks/useCaseLogs'

interface CaseLogHistoryProps {
  caseData: Case
  className?: string
}

export function CaseLogHistory({ caseData, className }: CaseLogHistoryProps) {
  const { user, hasRole } = useAuthStore()
  const [newLogEntry, setNewLogEntry] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    logs,
    isLoading,
    isError,
    error,
    addLog,
    isAddingLog,
    refreshLogs,
    refetch
  } = useCaseLogs(caseData.id)

  console.log('📝 [CaseLogHistory] Rendering for case:', caseData.id)
  console.log('📝 [CaseLogHistory] Current user:', user)
  console.log('📝 [CaseLogHistory] Logs state:', { 
    logsCount: logs.length, 
    isLoading, 
    isError, 
    isAddingLog 
  })
  if (logs.length > 0) {
    console.log('📝 [CaseLogHistory] Latest log:', logs[0])
  }

  // 添加新日志
  const handleAddLog = async () => {
    if (!newLogEntry.trim()) {
      console.warn('📝 [CaseLogHistory] Empty log entry attempted')
      return
    }

    console.log('📝 [CaseLogHistory] Adding log entry:', newLogEntry)
    console.log('📝 [CaseLogHistory] Current user adding log:', user)
    
    // 使用react-query mutation
    addLog(newLogEntry.trim())
    
    // 清空输入框并关闭表单（mutation成功后会自动刷新数据）
    setNewLogEntry('')
    setShowAddForm(false)
  }

  // 取消添加日志
  const handleCancelAdd = () => {
    console.log('📝 [CaseLogHistory] Cancelled adding log entry')
    setNewLogEntry('')
    setShowAddForm(false)
  }

  // 手动刷新日志
  const handleRefreshLogs = () => {
    console.log('📝 [CaseLogHistory] Manual refresh triggered')
    refreshLogs()
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  }

  // 获取操作类型的颜色
  const getActionColor = (action: string) => {
    const actionColors: Record<string, string> = {
      '创建案件': 'bg-blue-500',
      '指派案件': 'bg-yellow-500',
      '接受案件': 'bg-green-500',
      '拒绝案件': 'bg-red-500',
      '更新案件': 'bg-purple-500',
      '请求完成': 'bg-orange-500',
      '批准完成': 'bg-green-600',
      '拒绝完成': 'bg-red-600',
      '手动备注': 'bg-gray-500',
    }
    return actionColors[action] || 'bg-gray-400'
  }

  // 检查是否可以添加日志 - 根据案件状态和用户权限
  const canAddLog = () => {
    if (!user) return false;
    
    // ADMIN 和 MANAGER 几乎在所有情况下都可以添加备注
    if (hasRole(['ADMIN', 'MANAGER'])) {
      return true;
    }
    
    // 普通用户(USER/Caseworker)的权限检查
    if (hasRole(['USER'])) {
      // 1. 如果案件未指派，普通用户不能添加备注
      if (!caseData.assigned_to_id) {
        return false;
      }
      
      // 2. 如果案件已指派但不是指派给当前用户，不能添加备注
      if (caseData.assigned_to_id !== user.user_id) {
        return false;
      }
      
      // 3. 如果指派给了当前用户，检查案件状态
      switch (caseData.status) {
        case 'PENDING':
        case 'IN_PROGRESS':
        case 'PENDING_COMPLETION_REVIEW':
          return true;
        case 'OPEN':
        case 'COMPLETED':
        case 'CLOSED':
        case 'RESOLVED':
          return false;
        default:
          return false;
      }
    }
    
    return false;
  }

  // 获取不能添加备注的原因提示
  const getCannotAddLogReason = () => {
    if (!user) return '请先登录';
    
    if (hasRole(['ADMIN', 'MANAGER'])) {
      return null; // 管理员总是可以添加
    }
    
    if (hasRole(['USER'])) {
      if (!caseData.assigned_to_id) {
        return '案件尚未指派，只有管理员可以添加备注';
      }
      
      if (caseData.assigned_to_id !== user.user_id) {
        return '此案件未指派给您，无权添加备注';
      }
      
      switch (caseData.status) {
        case 'OPEN':
          return '案件状态异常，请联系管理员';
        case 'COMPLETED':
        case 'CLOSED':
        case 'RESOLVED':
          return '案件已完成，不能添加备注';
        default:
          return `案件状态 ${caseData.status} 不允许添加备注`;
      }
    }
    
    return '您没有权限添加备注';
  }

  console.log('📝 [CaseLogHistory] Current logs:', logs)
  console.log('📝 [CaseLogHistory] Can add log:', canAddLog())

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>案件历史记录</span>
            </CardTitle>
            <CardDescription>
              案件的所有操作记录和状态变更历史 ({logs.length} 条记录)
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {canAddLog() && !showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加备注
              </Button>
            ) : !canAddLog() && (
              <div className="text-sm text-muted-foreground italic">
                {getCannotAddLogReason()}
              </div>
            )}
            
            <Button
              onClick={handleRefreshLogs}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 添加日志表单 */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
            <h4 className="font-medium flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              添加备注
            </h4>
            <Textarea
              value={newLogEntry}
              onChange={(e) => setNewLogEntry(e.target.value)}
              placeholder="输入您的备注内容..."
              rows={3}
              disabled={isAddingLog}
            />
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleAddLog}
                disabled={isAddingLog || !newLogEntry.trim()}
                size="sm"
              >
                {isAddingLog ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                添加
              </Button>
              <Button
                onClick={handleCancelAdd}
                variant="outline"
                size="sm"
                disabled={isAddingLog}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>获取历史记录时出错: {error?.message || '未知错误'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                重试
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
            <span>加载历史记录中...</span>
          </div>
        )}

        {/* 日志列表 */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <Alert>
                <History className="h-4 w-4" />
                <AlertDescription>
                  暂无历史记录
                </AlertDescription>
              </Alert>
            ) : (
              <div className="relative">
                {/* 时间线 */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                
                {/* 日志条目 */}
                {logs.map((log, index) => (
                  <div key={`log-${log.log_id || index}`} className="relative flex items-start space-x-4 pb-6 last:pb-0">
                    {/* 时间线节点 */}
                    <div className={cn(
                      "h-3 w-3 rounded-full border-2 border-white z-10 flex-shrink-0 mt-1",
                      getActionColor(log.action)
                    )} />
                    
                    {/* 日志内容 */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{log.action}</h4>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.user?.username || '系统'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                      
                      {log.details && (
                        <div className="bg-gray-50 rounded p-3 text-sm text-muted-foreground">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
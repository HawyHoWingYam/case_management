'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Clock, 
  Calendar,
  FileText,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'  // 修复：使用正确的导入
import { Case } from '@/types/case'
import { CaseStatusBadge, CasePriorityBadge } from '@/components/cases/CaseStatusBadge'
import { CaseAcceptReject } from '@/components/cases/CaseAcceptReject'
import { CaseAssignment } from '@/components/cases/CaseAssignment'  // 新增：导入Chair指派组件
import { toast } from 'sonner'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, hasRole } = useAuthStore()
  
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const caseId = params.id as string

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取案件详情
  const fetchCaseDetail = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 [CaseDetailPage] Fetching case detail for ID:', caseId)
      const response = await api.cases.getById(parseInt(caseId, 10))  // 修复：使用api
      console.log('🔍 [CaseDetailPage] DEBUG: Full API response:', response)
      console.log('🔍 [CaseDetailPage] DEBUG: Case data:', response.data)
      console.log('🔍 [CaseDetailPage] DEBUG: Case metadata:', response.data.metadata)
      console.log('🔍 [CaseDetailPage] DEBUG: Metadata type:', typeof response.data.metadata)
      console.log('🔍 [CaseDetailPage] DEBUG: Metadata keys:', response.data.metadata ? Object.keys(response.data.metadata) : 'no metadata')
      
      // Check if there are any files in metadata
      if (response.data.metadata && response.data.metadata.attachments) {
        console.log('🔍 [CaseDetailPage] DEBUG: Found attachments:', response.data.metadata.attachments)
        console.log('🔍 [CaseDetailPage] DEBUG: Attachments count:', response.data.metadata.attachments.length)
      } else {
        console.log('🔍 [CaseDetailPage] DEBUG: No attachments found in metadata')
      }
      
      setCaseData(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '获取案件详情失败'
      console.error('🔍 [CaseDetailPage] DEBUG: Error fetching case detail:', error)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 删除案件
  const handleDeleteCase = async () => {
    if (!caseData) return
    
    if (!window.confirm(`确定要删除案件"${caseData.title}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      await api.cases.delete(parseInt(caseId, 10))  // 修复：使用api
      toast.success('案件删除成功')
      router.push('/cases')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '删除案件失败'
      toast.error(errorMessage)
    }
  }

  // 处理案件更新（用于accept/reject/assign操作）
  const handleCaseUpdate = (updatedCase: Case) => {
    console.log('🔍 [CaseDetailPage] Case updated:', updatedCase)
    setCaseData(updatedCase)
  }

  // 检查用户权限
  const canEditCase = () => {
    if (!caseData) return false
    
    // ADMIN 只能修改未被指派的案件
    if (hasRole(['ADMIN'])) {
      return !caseData.assigned_to_id
    }
    
    // MANAGER 只能修改未被指派的案件
    if (hasRole(['MANAGER'])) {
      return !caseData.assigned_to_id
    }
    
    // USER 可以修改自己创建的案件
    return caseData.created_by_id === user?.user_id
  }

  const canDeleteCase = () => {
    if (!caseData) return false
    if (hasRole(['ADMIN'])) return true
    return caseData.created_by_id === user?.user_id
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  }

  // 页面加载时获取数据
  useEffect(() => {
    if (mounted) {
      fetchCaseDetail()
    }
  }, [caseId, mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">案件详情</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">案件详情</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">案件详情</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || '案件不存在'}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCaseDetail}
                  className="ml-2"
                >
                  重试
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">案件详情</h1>
            <p className="text-muted-foreground">
              案件ID: {caseData.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {canEditCase() && (
            <Link href={`/cases/${caseId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </Link>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                导出案件
              </DropdownMenuItem>
              {canDeleteCase() && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDeleteCase}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除案件
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 案件基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{caseData.title}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <CaseStatusBadge status={caseData.status as any} />
              <CasePriorityBadge priority={caseData.priority as any} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 案件描述 */}
          {caseData.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">案件描述</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}

          <Separator />

          {/* 案件信息网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 创建者信息 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">创建者</h3>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{caseData.created_by?.username}</p>
                  <p className="text-xs text-muted-foreground">{caseData.created_by?.email}</p>
                </div>
              </div>
            </div>

            {/* 指派信息 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">指派给</h3>
              {caseData.assigned_to ? (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{caseData.assigned_to.username}</p>
                    <p className="text-xs text-muted-foreground">{caseData.assigned_to.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">未指派</p>
              )}
            </div>

            {/* 创建时间 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">创建时间</h3>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(caseData.created_at)}</p>
              </div>
            </div>

            {/* 更新时间 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">最后更新</h3>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(caseData.updated_at)}</p>
              </div>
            </div>

            {/* 截止日期 */}
            {caseData.due_date && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">截止日期</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{formatDate(caseData.due_date)}</p>
                </div>
              </div>
            )}
          </div>

          {/* 元数据 */}
          {caseData.metadata && Object.keys(caseData.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">附加信息</h3>
                {/* DEBUG: Log what we're about to render */}
                {console.log('🔍 [CaseDetailPage] DEBUG: Rendering metadata section')}
                {console.log('🔍 [CaseDetailPage] DEBUG: caseData.metadata:', caseData.metadata)}
                <div className="space-y-2">
                  {Object.entries(caseData.metadata).map(([key, value], metaIndex) => {
                    console.log(`🔍 [CaseDetailPage] DEBUG: Metadata entry ${metaIndex}: key="${key}", value=`, value)
                    
                    // Special handling for attachments
                    if (key === 'attachments' && Array.isArray(value)) {
                      console.log('🔍 [CaseDetailPage] DEBUG: Found attachments array with length:', value.length)
                      return (
                        <div key={`meta-${key}-${metaIndex}`} className="space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">文件附件:</span>
                          <div className="space-y-1">
                            {value.map((attachment: any, attachmentIndex: number) => (
                              <div key={`attachment-${attachmentIndex}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{attachment.originalname || attachment.filename}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({attachment.size ? `${Math.round(attachment.size / 1024)}KB` : 'N/A'})
                                  </span>
                                </div>
                                {attachment.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                      下载
                                    </a>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    
                    // Default metadata display
                    return (
                      <div key={`meta-${key}-${metaIndex}`} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{key}:</span>
                        <span className="text-sm font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 新增：Chair指派功能 - 只对ADMIN/MANAGER且案件状态为OPEN时显示 */}
      <CaseAssignment 
        caseData={caseData}
        onCaseUpdate={handleCaseUpdate}
        className="mb-6"
      />

      {/* Case Accept/Reject Actions - 只对被指派的USER且状态为PENDING时显示 */}
      <CaseAcceptReject 
        caseData={caseData}
        onCaseUpdate={handleCaseUpdate}
        className="mb-6"
      />

      {/* 操作日志 */}
      {caseData.case_logs && caseData.case_logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>操作日志</CardTitle>
            <CardDescription>
              案件的所有操作记录和状态变更历史
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.case_logs.map((log, logIndex) => (
                <div key={`log-${log.id || logIndex}`} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    {log.details && (
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {log.user?.username || '系统'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
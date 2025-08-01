'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  FileText,
  Clock,
  User,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { 
  Case, 
  CaseStatus, 
  CasePriority, 
  CaseFilters,
  CASE_STATUS_CONFIG,
  CASE_PRIORITY_CONFIG 
} from '@/types/case'
import { CaseStatusBadge, CasePriorityBadge } from '@/components/cases/CaseStatusBadge'
import { toast } from 'sonner'

export default function CasesPage() {
  const router = useRouter()
  const { user, hasRole } = useAuthStore()
  
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CaseFilters>({})
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 获取案件列表
  const fetchCases = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.cases.getAll({
        ...filters,
        search: searchTerm || undefined,
      })
      setCases(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '获取案件列表失败'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 删除案件
  const handleDeleteCase = async (caseId: number, caseTitle: string) => {
    if (!window.confirm(`确定要删除案件"${caseTitle}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      await apiClient.cases.delete(caseId)
      setCases(prev => prev.filter(c => c.id !== caseId))
      toast.success('案件删除成功')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '删除案件失败'
      toast.error(errorMessage)
    }
  }

  // 检查用户权限
  const canEditCase = (caseItem: Case) => {
    if (hasRole(['ADMIN', 'MANAGER'])) return true
    return caseItem.created_by_id === user?.user_id
  }

  const canDeleteCase = (caseItem: Case) => {
    if (hasRole(['ADMIN'])) return true
    return caseItem.created_by_id === user?.user_id
  }

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCases()
  }

  // 处理筛选变化
  const handleFilterChange = (key: keyof CaseFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  // 清除筛选
  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN })
  }

  // 页面加载时获取数据
  useEffect(() => {
    if (mounted) {
      fetchCases()
    }
  }, [filters, mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">案件管理</h1>
            <p className="text-muted-foreground">
              查看和管理所有案件信息
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">案件管理</h1>
          <p className="text-muted-foreground">
            查看和管理所有案件信息
          </p>
        </div>
        
        {hasRole(['USER', 'MANAGER', 'ADMIN']) && (
          <Link href="/cases/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建案件
            </Button>
          </Link>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>搜索和筛选</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1">
                <Input
                  placeholder="搜索案件标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* 状态筛选 */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  {Object.entries(CASE_STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 优先级筛选 */}
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="优先级筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有优先级</SelectItem>
                  {Object.entries(CASE_PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                disabled={loading}
              >
                清除筛选
              </Button>
              <Button type="submit" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 案件列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>案件列表</span>
            </div>
            <Badge variant="secondary">
              总计: {cases.length} 个案件
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCases}
                  className="ml-2"
                >
                  重试
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
              <span>加载中...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无案件</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || Object.keys(filters).length > 0 
                  ? '没有找到符合条件的案件' 
                  : '还没有创建任何案件'
                }
              </p>
              {hasRole(['USER', 'MANAGER', 'ADMIN']) && (
                <Link href="/cases/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个案件
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>创建者</TableHead>
                    <TableHead>指派给</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.title}</div>
                          {caseItem.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {caseItem.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CaseStatusBadge status={caseItem.status} />
                      </TableCell>
                      <TableCell>
                        <CasePriorityBadge priority={caseItem.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span className="text-sm">{caseItem.created_by.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.assigned_to ? (
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{caseItem.assigned_to.username}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">未指派</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">{formatDate(caseItem.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/cases/${caseItem.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            {canEditCase(caseItem) && (
                              <DropdownMenuItem
                                onClick={() => router.push(`/cases/${caseItem.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                            )}
                            {canDeleteCase(caseItem) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteCase(caseItem.id, caseItem.title)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
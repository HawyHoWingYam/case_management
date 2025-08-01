// frontend/src/components/cases/CaseList.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  AlertCircle,
  RefreshCw,
  Grid,
  List
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { Case, CaseQueryParams } from '@/types/case'
import { useCases } from '@/hooks/useCases'
import { useCaseActions } from '@/hooks/useCaseActions'
import { useAuthStore } from '@/stores/authStore'
import { CaseTable } from './CaseTable'
import { CaseCard } from './CaseCard'
import { CaseFilters } from './CaseFilters'
import { CasePagination } from './CasePagination'

interface CaseListProps {
  initialFilters?: Partial<CaseQueryParams>
  view?: 'table' | 'card' | 'auto'
  showFilters?: boolean
  showSearch?: boolean
  showPagination?: boolean
  title?: string
  description?: string
  emptyMessage?: string
  className?: string
}

export function CaseList({
  initialFilters = {},
  view = 'auto',
  showFilters = true,
  showSearch = true,
  showPagination = true,
  title = '案件列表',
  description,
  emptyMessage = '暂无案件数据',
  className,
}: CaseListProps) {
  const router = useRouter()
  const { hasRole } = useAuthStore()
  
  // 状态管理
  const [filters, setFilters] = useState<Partial<CaseQueryParams>>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentView, setCurrentView] = useState<'table' | 'card'>(
    view === 'auto' ? 'table' : view
  )
  const [selectedCases, setSelectedCases] = useState<number[]>([])

  // 构建查询参数
  const queryParams = useMemo((): CaseQueryParams => ({
    ...filters,
    search: searchTerm || undefined,
    page: filters.page || 1,
    limit: filters.limit || 20,
  }), [filters, searchTerm])

  // 数据获取
  const {
    data: caseResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useCases(queryParams)

  const cases = caseResponse?.data || []
  const meta = caseResponse?.meta
  const availableFilters = caseResponse?.filters?.available

  // 操作 hooks
  const bulkActions = useCaseActions()

  // 权限检查
  const canEditCase = (caseItem: Case) => {
    if (hasRole(['ADMIN', 'MANAGER'])) return true
    return caseItem.created_by_id === useAuthStore.getState().user?.user_id
  }

  const canDeleteCase = (caseItem: Case) => {
    if (hasRole(['ADMIN'])) return true
    return caseItem.created_by_id === useAuthStore.getState().user?.user_id
  }

  // 事件处理
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, page: 1 })) // 重置页码
  }

  const handleFilterChange = (newFilters: Partial<CaseQueryParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleCaseAction = (action: string, caseId: number, caseData?: Case) => {
    switch (action) {
      case 'view':
        router.push(`/cases/${caseId}`)
        break
      case 'edit':
        router.push(`/cases/${caseId}/edit`)
        break
      case 'delete':
        if (caseData && window.confirm(`确定要删除案件"${caseData.title}"吗？`)) {
          // 这里调用删除 API
        }
        break
      default:
        break
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedCases.length === 0) return

    switch (action) {
      case 'delete':
        if (window.confirm(`确定要删除选中的 ${selectedCases.length} 个案件吗？`)) {
          bulkActions.mutate({
            action: 'delete',
            caseIds: selectedCases,
            payload: {}
          })
        }
        break
      // 可以添加更多批量操作
    }
  }

  const handleCaseSelect = (caseId: number, selected: boolean) => {
    setSelectedCases(prev => 
      selected 
        ? [...prev, caseId]
        : prev.filter(id => id !== caseId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedCases(selected ? cases.map(c => c.id) : [])
  }

  // 响应式视图切换
  const shouldShowCard = currentView === 'card' || (view === 'auto' && window.innerWidth < 768)

  if (isError) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>加载案件列表失败：{error?.message || '未知错误'}</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
          {meta && (
            <p className="text-sm text-muted-foreground">
              共 {meta.total} 个案件，当前显示第 {meta.page} 页
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          {view === 'auto' && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={currentView === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('card')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 刷新按钮 */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* 批量操作 */}
          {selectedCases.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  批量操作 ({selectedCases.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除选中
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 搜索和筛选 */}
      {(showSearch || showFilters) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* 搜索框 */}
              {showSearch && (
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索案件标题或描述..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>
              )}

              {/* 筛选器 */}
              {showFilters && availableFilters && (
                <CaseFilters
                  filters={filters}
                  availableFilters={availableFilters}
                  onFiltersChange={handleFilterChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 案件列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>案件列表</span>
            </div>
            {meta && (
              <Badge variant="secondary">
                {meta.total} 个案件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CaseListSkeleton view={currentView} />
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无案件</h3>
              <p className="text-muted-foreground mb-4">{emptyMessage}</p>
              {hasRole(['USER', 'MANAGER', 'ADMIN']) && (
                <Button onClick={() => router.push('/cases/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个案件
                </Button>
              )}
            </div>
          ) : shouldShowCard ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  case={caseItem}
                  onAction={(action) => handleCaseAction(action, caseItem.id, caseItem)}
                  canEdit={canEditCase(caseItem)}
                  canDelete={canDeleteCase(caseItem)}
                  isSelected={selectedCases.includes(caseItem.id)}
                  onSelect={(selected) => handleCaseSelect(caseItem.id, selected)}
                />
              ))}
            </div>
          ) : (
            <CaseTable
              cases={cases}
              onAction={handleCaseAction}
              canEdit={canEditCase}
              canDelete={canDeleteCase}
              selectedCases={selectedCases}
              onCaseSelect={handleCaseSelect}
              onSelectAll={handleSelectAll}
            />
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {showPagination && meta && meta.totalPages > 1 && (
        <CasePagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

// 骨架屏组件
function CaseListSkeleton({ view }: { view: 'table' | 'card' }) {
  if (view === 'card') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>
      ))}
    </div>
  )
}

// ================================================
// frontend/src/components/cases/CaseTable.tsx

interface CaseTableProps {
  cases: Case[]
  onAction: (action: string, caseId: number, caseData?: Case) => void
  canEdit: (caseItem: Case) => boolean
  canDelete: (caseItem: Case) => boolean
  selectedCases: number[]
  onCaseSelect: (caseId: number, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export function CaseTable({
  cases,
  onAction,
  canEdit,
  canDelete,
  selectedCases,
  onCaseSelect,
  onSelectAll,
}: CaseTableProps) {
  const allSelected = cases.length > 0 && selectedCases.length === cases.length
  const someSelected = selectedCases.length > 0 && selectedCases.length < cases.length

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th className="text-left p-2">标题</th>
            <th className="text-left p-2">状态</th>
            <th className="text-left p-2">优先级</th>
            <th className="text-left p-2">创建者</th>
            <th className="text-left p-2">指派给</th>
            <th className="text-left p-2">创建时间</th>
            <th className="text-right p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((caseItem) => (
            <tr key={caseItem.id} className="border-b hover:bg-accent">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedCases.includes(caseItem.id)}
                  onChange={(e) => onCaseSelect(caseItem.id, e.target.checked)}
                />
              </td>
              <td className="p-2">
                <div>
                  <div className="font-medium">{caseItem.title}</div>
                  {caseItem.description && (
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {caseItem.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="p-2">
                <Badge variant="outline">{caseItem.status}</Badge>
              </td>
              <td className="p-2">
                <Badge variant="secondary">{caseItem.priority}</Badge>
              </td>
              <td className="p-2">
                <span className="text-sm">{caseItem.created_by?.username}</span>
              </td>
              <td className="p-2">
                {caseItem.assigned_to ? (
                  <span className="text-sm">{caseItem.assigned_to.username}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">未指派</span>
                )}
              </td>
              <td className="p-2">
                <span className="text-sm">
                  {new Date(caseItem.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="p-2 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onAction('view', caseItem.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      查看详情
                    </DropdownMenuItem>
                    {canEdit(caseItem) && (
                      <DropdownMenuItem onClick={() => onAction('edit', caseItem.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                    )}
                    {canDelete(caseItem) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onAction('delete', caseItem.id, caseItem)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ================================================
// frontend/src/components/cases/CaseCard.tsx

interface CaseCardProps {
  case: Case
  onAction: (action: string) => void
  canEdit: boolean
  canDelete: boolean
  isSelected: boolean
  onSelect: (selected: boolean) => void
}

export function CaseCard({
  case: caseItem,
  onAction,
  canEdit,
  canDelete,
  isSelected,
  onSelect,
}: CaseCardProps) {
  return (
    <Card className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <CardTitle className="text-sm font-medium leading-none">
              {caseItem.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction('view')}>
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onAction('edit')}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {caseItem.description && (
          <CardDescription className="text-xs">
            {caseItem.description.length > 100 
              ? `${caseItem.description.substring(0, 100)}...`
              : caseItem.description
            }
          </CardDescription>
        )}
      </CardHeader>
      <CardContent 
        className="pt-0 space-y-2"
        onClick={() => onAction('view')}
      >
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <Badge variant="outline" className="text-xs">
              {caseItem.status}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {caseItem.priority}
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>创建者：{caseItem.created_by?.username}</div>
          <div>
            {caseItem.assigned_to 
              ? `负责人：${caseItem.assigned_to.username}` 
              : '未指派'
            }
          </div>
          <div>{new Date(caseItem.created_at).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
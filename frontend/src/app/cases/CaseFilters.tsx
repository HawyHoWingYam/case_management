// frontend/src/components/cases/CaseFilters.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { CaseQueryParams } from '@/types/case'
import { cn } from '@/lib/utils'

interface CaseFiltersProps {
  filters: Partial<CaseQueryParams>
  availableFilters: {
    statuses: Array<{ value: string; label: string; count: number }>
    priorities: Array<{ value: string; label: string; count: number }>
    assignees: Array<{ id: number; name: string }>
    creators: Array<{ id: number; name: string }>
  }
  onFiltersChange: (filters: Partial<CaseQueryParams>) => void
  className?: string
}

export function CaseFilters({
  filters,
  availableFilters,
  onFiltersChange,
  className,
}: CaseFiltersProps) {
  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key] !== undefined && key !== 'page' && key !== 'limit'
  )

  const handleFilterChange = (key: keyof CaseQueryParams, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    })
  }

  const removeFilter = (key: keyof CaseQueryParams) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 筛选控件 */}
      <div className="flex flex-wrap gap-2">
        {/* 状态筛选 */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            {availableFilters.statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{status.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {status.count}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 优先级筛选 */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有优先级</SelectItem>
            {availableFilters.priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{priority.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {priority.count}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 指派人筛选 */}
        <Select
          value={filters.assignedTo?.toString() || 'all'}
          onValueChange={(value) => handleFilterChange('assignedTo', value === 'all' ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="指派给" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有人员</SelectItem>
            <SelectItem value="unassigned">未指派</SelectItem>
            {availableFilters.assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id.toString()}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 创建者筛选 */}
        <Select
          value={filters.createdBy?.toString() || 'all'}
          onValueChange={(value) => handleFilterChange('createdBy', value === 'all' ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="创建者" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有创建者</SelectItem>
            {availableFilters.creators.map((creator) => (
              <SelectItem key={creator.id} value={creator.id.toString()}>
                {creator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 创建时间筛选 */}
        <DateRangeFilter
          startDate={filters.createdAfter}
          endDate={filters.createdBefore}
          onDateChange={(start, end) => {
            handleFilterChange('createdAfter', start)
            handleFilterChange('createdBefore', end)
          }}
          placeholder="创建时间"
        />

        {/* 排序 */}
        <Select
          value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-')
            handleFilterChange('sortBy', sortBy)
            handleFilterChange('sortOrder', sortOrder)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">最新创建</SelectItem>
            <SelectItem value="created_at-asc">最早创建</SelectItem>
            <SelectItem value="updated_at-desc">最近更新</SelectItem>
            <SelectItem value="updated_at-asc">最早更新</SelectItem>
            <SelectItem value="title-asc">标题 A-Z</SelectItem>
            <SelectItem value="title-desc">标题 Z-A</SelectItem>
            <SelectItem value="priority-desc">优先级高-低</SelectItem>
            <SelectItem value="priority-asc">优先级低-高</SelectItem>
          </SelectContent>
        </Select>

        {/* 清除筛选按钮 */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
        )}
      </div>

      {/* 活跃筛选标签 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          <span className="text-sm text-muted-foreground flex items-center">
            <Filter className="h-3 w-3 mr-1" />
            当前筛选:
          </span>
          
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              状态: {availableFilters.statuses.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => removeFilter('status')}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="secondary" className="text-xs">
              优先级: {availableFilters.priorities.find(p => p.value === filters.priority)?.label}
              <button
                onClick={() => removeFilter('priority')}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.assignedTo && (
            <Badge variant="secondary" className="text-xs">
              指派给: {availableFilters.assignees.find(a => a.id === filters.assignedTo)?.name}
              <button
                onClick={() => removeFilter('assignedTo')}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.createdBy && (
            <Badge variant="secondary" className="text-xs">
              创建者: {availableFilters.creators.find(c => c.id === filters.createdBy)?.name}
              <button
                onClick={() => removeFilter('createdBy')}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.createdAfter || filters.createdBefore) && (
            <Badge variant="secondary" className="text-xs">
              创建时间: {filters.createdAfter && format(new Date(filters.createdAfter), 'yyyy-MM-dd')} - {filters.createdBefore && format(new Date(filters.createdBefore), 'yyyy-MM-dd')}
              <button
                onClick={() => {
                  removeFilter('createdAfter')
                  removeFilter('createdBefore')
                }}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// 日期范围筛选组件
interface DateRangeFilterProps {
  startDate?: string
  endDate?: string
  onDateChange: (startDate?: string, endDate?: string) => void
  placeholder: string
}

function DateRangeFilter({ startDate, endDate, onDateChange, placeholder }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempStartDate, setTempStartDate] = React.useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  )
  const [tempEndDate, setTempEndDate] = React.useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  )

  const handleApply = () => {
    onDateChange(
      tempStartDate?.toISOString(),
      tempEndDate?.toISOString()
    )
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStartDate(undefined)
    setTempEndDate(undefined)
    onDateChange(undefined, undefined)
    setIsOpen(false)
  }

  const displayText = startDate || endDate
    ? `${startDate ? format(new Date(startDate), 'MM/dd') : '开始'} - ${endDate ? format(new Date(endDate), 'MM/dd') : '结束'}`
    : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[200px] justify-start text-left font-normal',
            !(startDate || endDate) && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">开始日期</label>
            <Calendar
              mode="single"
              selected={tempStartDate}
              onSelect={setTempStartDate}
              disabled={(date) => tempEndDate && date > tempEndDate}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">结束日期</label>
            <Calendar
              mode="single"
              selected={tempEndDate}
              onSelect={setTempEndDate}
              disabled={(date) => tempStartDate && date < tempStartDate}
            />
          </div>
          <div className="flex justify-between space-x-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              清除
            </Button>
            <Button size="sm" onClick={handleApply}>
              应用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ================================================
// frontend/src/components/cases/CasePagination.tsx

interface CasePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function CasePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: CasePaginationProps) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 复杂的分页逻辑
      if (currentPage <= 4) {
        // 当前页在开始部分
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // 当前页在结束部分
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间部分
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-muted-foreground">
        第 {currentPage} 页，共 {totalPages} 页
      </div>
      
      <div className="flex items-center space-x-1">
        {/* 上一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </Button>

        {/* 页码 */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            )
          }

          const pageNum = page as number
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="min-w-[40px]"
            >
              {pageNum}
            </Button>
          )
        })}

        {/* 下一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

// 快速跳转组件（可选）
interface PageJumperProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PageJumper({ currentPage, totalPages, onPageChange }: PageJumperProps) {
  const [inputValue, setInputValue] = React.useState(currentPage.toString())

  const handleJump = () => {
    const page = parseInt(inputValue, 10)
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
    setInputValue(currentPage.toString())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump()
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>跳转到</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-16 px-2 py-1 border rounded text-center"
      />
      <span>页</span>
      <Button size="sm" variant="outline" onClick={handleJump}>
        跳转
      </Button>
    </div>
  )
}
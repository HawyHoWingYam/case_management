'use client'

import React, { useState, useEffect } from 'react'
import { 
  Filter, 
  X, 
  CheckCircle, 
  XCircle, 
  Flag, 
  MessageSquare, 
  Megaphone,
  UserPlus,
  ArrowUpDown,
  Search,
  Calendar,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface NotificationFilters {
  types: string[]
  status: 'all' | 'read' | 'unread'
  dateRange: 'all' | 'today' | 'week' | 'month'
  search: string
  priority: 'all' | 'high' | 'normal'
  actionType: string[]
}

interface NotificationFiltersProps {
  filters: NotificationFilters
  onFiltersChange: (filters: NotificationFilters) => void
  notificationCounts?: {
    total: number
    unread: number
    byType: Record<string, number>
  }
  className?: string
}

// Stage 3 Goal 3: Notification type options with enhanced completion workflow support
const notificationTypeOptions = [
  { value: 'CASE_ASSIGNED', label: '案件指派', icon: UserPlus, color: 'text-blue-600' },
  { value: 'CASE_ACCEPTED', label: '案件接受', icon: CheckCircle, color: 'text-green-600' },
  { value: 'CASE_REJECTED', label: '案件拒绝', icon: XCircle, color: 'text-red-600' },
  { value: 'CASE_STATUS_CHANGED', label: '状态变更', icon: ArrowUpDown, color: 'text-purple-600' },
  { value: 'CASE_PRIORITY_CHANGED', label: '优先级变更', icon: Flag, color: 'text-orange-600' },
  { value: 'CASE_COMMENT_ADDED', label: '新评论', icon: MessageSquare, color: 'text-teal-600' },
  { value: 'SYSTEM_ANNOUNCEMENT', label: '系统公告', icon: Megaphone, color: 'text-indigo-600' },
]

// Stage 3 Goal 3: Action type options for completion workflow
const actionTypeOptions = [
  { value: 'COMPLETION_REQUEST', label: '完成审批请求', color: 'text-amber-600' },
  { value: 'COMPLETION_APPROVED', label: '完成已批准', color: 'text-emerald-600' },
  { value: 'COMPLETION_REJECTED', label: '完成被拒绝', color: 'text-rose-600' },
]

export function NotificationFilters({
  filters,
  onFiltersChange,
  notificationCounts,
  className,
}: NotificationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  console.log('🔔 [NotificationFilters] Rendering filters:', {
    filters,
    counts: notificationCounts
  })

  // Count active filters
  const activeFiltersCount = [
    filters.types.length > 0,
    filters.status !== 'all',
    filters.dateRange !== 'all',
    filters.search.length > 0,
    filters.priority !== 'all',
    filters.actionType.length > 0,
  ].filter(Boolean).length

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    console.log('🔔 [NotificationFilters] Filter changed:', { key, value })
    
    const newFilters = {
      ...filters,
      [key]: value,
    }
    onFiltersChange(newFilters)
  }

  const handleTypeToggle = (type: string, checked: boolean) => {
    console.log('🔔 [NotificationFilters] Type toggle:', { type, checked })
    
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type)
    
    handleFilterChange('types', newTypes)
  }

  const handleActionTypeToggle = (actionType: string, checked: boolean) => {
    console.log('🔔 [NotificationFilters] Action type toggle:', { actionType, checked })
    
    const newActionTypes = checked
      ? [...filters.actionType, actionType]
      : filters.actionType.filter(t => t !== actionType)
    
    handleFilterChange('actionType', newActionTypes)
  }

  const clearFilters = () => {
    console.log('🔔 [NotificationFilters] Clearing all filters')
    
    const defaultFilters: NotificationFilters = {
      types: [],
      status: 'all',
      dateRange: 'all',
      search: '',
      priority: 'all',
      actionType: [],
    }
    onFiltersChange(defaultFilters)
  }

  const clearSearch = () => {
    handleFilterChange('search', '')
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索通知..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-9 pr-8"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Quick Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="unread">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              未读
            </div>
          </SelectItem>
          <SelectItem value="read">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              已读
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Advanced Filters Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            筛选
            {activeFiltersCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">高级筛选</h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  清空
                </Button>
              )}
            </div>

            {/* Date Range Filter */}
            <div>
              <Label className="text-sm font-medium">时间范围</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">最近一周</SelectItem>
                  <SelectItem value="month">最近一月</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Label className="text-sm font-medium">优先级</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先级</SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      高优先级
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-gray-500" />
                      普通优先级
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Notification Types */}
            <div>
              <Label className="text-sm font-medium">通知类型</Label>
              <div className="space-y-2 mt-2">
                {notificationTypeOptions.map((option) => {
                  const IconComponent = option.icon
                  const count = notificationCounts?.byType[option.value] || 0
                  
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={filters.types.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleTypeToggle(option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={option.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <IconComponent className={cn('w-4 h-4', option.color)} />
                        <span>{option.label}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {count}
                          </Badge>
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Stage 3 Goal 3: Action Types for Completion Workflow */}
            <div>
              <Label className="text-sm font-medium">完成流程</Label>
              <div className="space-y-2 mt-2">
                {actionTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`action-${option.value}`}
                      checked={filters.actionType.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleActionTypeToggle(option.value, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`action-${option.value}`}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <div className={cn('w-2 h-2 rounded-full', option.color.replace('text-', 'bg-'))} />
                      <span>{option.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1">
          {filters.types.map((type) => {
            const option = notificationTypeOptions.find(opt => opt.value === type)
            if (!option) return null
            
            return (
              <Badge 
                key={type}
                variant="secondary" 
                className="flex items-center gap-1 pr-1"
              >
                <option.icon className={cn('w-3 h-3', option.color)} />
                {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 ml-1"
                  onClick={() => handleTypeToggle(type, false)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )
          })}
          
          {filters.actionType.map((actionType) => {
            const option = actionTypeOptions.find(opt => opt.value === actionType)
            if (!option) return null
            
            return (
              <Badge 
                key={actionType}
                variant="secondary" 
                className="flex items-center gap-1 pr-1"
              >
                <div className={cn('w-2 h-2 rounded-full', option.color.replace('text-', 'bg-'))} />
                {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 ml-1"
                  onClick={() => handleActionTypeToggle(actionType, false)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationFilters
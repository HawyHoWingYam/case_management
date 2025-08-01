'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Search, Filter, RefreshCw, Eye } from 'lucide-react'
import Link from 'next/link'

import { CaseQueryParams, Case } from '@/types/case'
import { CaseStatusBadge } from './CaseStatusBadge'
import { apiClient } from '@/lib/api'

interface CaseListProps {
  initialFilters?: Partial<CaseQueryParams>
  className?: string
}

export function CaseList({ initialFilters = {}, className }: CaseListProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [filters, setFilters] = useState<Partial<CaseQueryParams>>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCases = async () => {
    try {
      setIsLoading(true)
      setIsError(false)
      
      const queryParams = { ...filters }
      if (searchTerm) {
        queryParams.search = searchTerm
      }
      
      const response = await apiClient.cases.getAll(queryParams)
      setCases(response.data || [])
    } catch (error) {
      console.error('Failed to fetch cases:', error)
      setIsError(true)
      setCases([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [filters, searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleFilterChange = (key: keyof CaseQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const refresh = () => {
    fetchCases()
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">加载失败</h3>
              <p className="text-muted-foreground mb-4">无法加载案例列表，请稍后重试</p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索案例..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="OPEN">开放</SelectItem>
                <SelectItem value="PENDING">待处理</SelectItem>
                <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                <SelectItem value="RESOLVED">已解决</SelectItem>
                <SelectItem value="CLOSED">已关闭</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.priority || 'all'} 
              onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
                <SelectItem value="URGENT">紧急</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={refresh} 
              variant="outline" 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 案例列表 */}
      <Card>
        <CardHeader>
          <CardTitle>案例列表</CardTitle>
          <CardDescription>
            {isLoading ? '加载中...' : `共 ${cases.length} 个案例`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CaseListSkeleton />
          ) : cases.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">暂无案例数据</div>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <CaseItem key={caseItem.id} case={caseItem} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CaseItem({ case: caseItem }: { case: Case }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{caseItem.title}</h3>
              <CaseStatusBadge status={caseItem.status as any} />
              <Badge variant="outline">
                {caseItem.priority}
              </Badge>
            </div>
            
            {caseItem.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {caseItem.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>ID: {caseItem.id}</span>
              <span>创建时间: {new Date(caseItem.created_at).toLocaleDateString()}</span>
              {caseItem.updated_at && (
                <span>更新时间: {new Date(caseItem.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/cases/${caseItem.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                查看
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CaseListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
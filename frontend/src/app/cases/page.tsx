'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CaseList } from '@/components/cases/CaseList'
import { useAuthStore } from '@/stores/authStore'
import { CaseQueryParams } from '@/types/case'

export default function CasesPage() {
  const searchParams = useSearchParams()
  const { hasRole } = useAuthStore()
  const [canCreateCase, setCanCreateCase] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Fix hydration issue by only checking roles on client-side
  useEffect(() => {
    setIsClient(true)
    setCanCreateCase(hasRole(['ADMIN', 'MANAGER']))
  }, [hasRole])

  // 从URL参数构建初始筛选条件
  const initialFilters: Partial<CaseQueryParams> = {}
  
  if (searchParams) {
    const view = searchParams.get('view')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search')
    const page = searchParams.get('page')
    
    if (view) initialFilters.view = view as any
    if (status) initialFilters.status = status as any
    if (priority) initialFilters.priority = priority as any
    if (assignedTo) initialFilters.assignedTo = parseInt(assignedTo)
    if (search) initialFilters.search = search
    if (page) initialFilters.page = parseInt(page)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">案例管理</h1>
          <p className="text-muted-foreground mt-1">
            管理和跟踪所有案例
          </p>
        </div>
        
        {isClient && canCreateCase && (
          <Link href="/cases/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建案例
            </Button>
          </Link>
        )}
      </div>

      <CaseList initialFilters={initialFilters} />
    </div>
  )
}
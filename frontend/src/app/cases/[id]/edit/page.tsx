'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CaseEditPage() {
  const params = useParams()
  const caseId = params.id as string

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href={`/cases/${caseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">编辑案件</h1>
            <p className="text-muted-foreground">
              案件ID: {caseId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/cases/${caseId}`}>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
          </Link>
          <Button disabled>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 功能开发中提示 */}
      <Card>
        <CardHeader>
          <CardTitle>案件编辑功能</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              案件编辑功能正在开发中。目前您可以：
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>查看案件详细信息</li>
                <li>通过案件详情页面的操作菜单进行基本操作</li>
                <li>使用案件列表页面的筛选和搜索功能</li>
              </ul>
              <div className="mt-4">
                <Link href={`/cases/${caseId}`}>
                  <Button variant="outline">
                    返回案件详情
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
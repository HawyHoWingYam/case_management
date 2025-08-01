'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Plus, Settings } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground mt-1">
            管理系统用户和权限设置
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新建用户
        </Button>
      </div>

      {/* 功能开发中提示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>用户管理功能</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              用户管理功能正在开发中，敬请期待。目前您可以：
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>通过案例管理查看用户信息</li>
                <li>在案例详情中查看创建者和指派信息</li>
                <li>使用现有的用户权限系统</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
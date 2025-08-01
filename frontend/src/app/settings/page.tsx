'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, User, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground mt-1">
          管理您的账户设置和系统偏好
        </p>
      </div>

      {/* 设置卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 个人资料设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>个人资料</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              管理您的个人信息和账户详情
            </p>
            <Button variant="outline" disabled>
              编辑资料
            </Button>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>通知设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              配置您的通知偏好设置
            </p>
            <Button variant="outline" disabled>
              通知设置
            </Button>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>安全设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              管理密码和安全选项
            </p>
            <Button variant="outline" disabled>
              安全设置
            </Button>
          </CardContent>
        </Card>

        {/* 界面设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>界面设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              自定义界面主题和显示选项
            </p>
            <Button variant="outline" disabled>
              界面设置
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 功能开发中提示 */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          设置功能正在开发中。目前系统使用默认配置运行，更多个性化设置功能即将推出。
        </AlertDescription>
      </Alert>
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { CreateCaseFormData } from '@/types/case'
import { CaseForm } from '@/components/cases/CaseForm'
import { toast } from 'sonner'

export default function CreateCasePage() {
  const router = useRouter()
  const { user, hasRole } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // 检查权限
  if (!hasRole(['USER', 'MANAGER', 'ADMIN'])) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">创建新案件</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>
                您没有权限创建案件。请联系管理员获取相应权限。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 处理表单提交
  const handleSubmit = async (data: CreateCaseFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await apiClient.cases.create(data)
      
      setSubmitSuccess(true)
      
      // 显示成功消息
      toast.success('案件创建成功！')
      
      // 2秒后跳转到案件详情页
      setTimeout(() => {
        router.push(`/cases/${response.data.id}`)
      }, 2000)
      
    } catch (error: any) {
      console.error('创建案件失败:', error)
      throw error // 让表单组件处理错误显示
    } finally {
      setIsSubmitting(false)
    }
  }

  // 如果提交成功，显示成功页面
  if (submitSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回案件列表
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">创建新案件</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">案件创建成功！</h2>
              <p className="text-muted-foreground mb-6">
                您的案件已成功创建，正在跳转到案件详情页...
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/cases">
                  <Button variant="outline">
                    返回案件列表
                  </Button>
                </Link>
                <Button onClick={() => window.location.reload()}>
                  创建另一个案件
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和导航 */}
      <div className="flex items-center space-x-4">
        <Link href="/cases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建新案件</h1>
          <p className="text-muted-foreground">
            填写案件信息以创建新的案件记录
          </p>
        </div>
      </div>

      {/* 用户信息提示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>创建者信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 案件创建表单 */}
      <CaseForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        mode="create"
      />

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 创建案件提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>案件标题：</strong>请使用简洁明了的标题描述问题的核心。
            </p>
            <p>
              <strong>详细描述：</strong>提供足够的背景信息和具体细节，有助于处理人员更好地理解问题。
            </p>
            <p>
              <strong>优先级设置：</strong>根据问题的紧急程度和影响范围选择合适的优先级：
            </p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li><strong>紧急：</strong>严重影响业务运行，需要立即处理</li>
              <li><strong>高：</strong>重要问题，需要尽快处理</li>
              <li><strong>中：</strong>一般问题，正常处理时间内解决</li>
              <li><strong>低：</strong>轻微问题，可以排期处理</li>
            </ul>
            <p>
              <strong>文件附件：</strong>可以上传相关的截图、文档等文件，有助于问题的诊断和解决。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
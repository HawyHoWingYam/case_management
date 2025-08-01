'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

// 表单验证模式
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码长度至少为6位')
    .max(100, '密码长度不能超过100位'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()
  const { signIn, isLoggingIn } = useAuth()
  const { isAuthenticated, error, clearError } = useAuthStore()

  // 解决水合不匹配问题
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, mounted, router])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    clearError()
    await signIn(values)
  }

  // 清除错误消息
  const handleClearError = () => {
    clearError()
  }

  // 测试账户信息
  const testAccounts = [
    { role: '管理员', email: 'admin@example.com', password: 'admin123', variant: 'destructive' as const },
    { role: '经理', email: 'manager@example.com', password: 'manager123', variant: 'default' as const },
    { role: '用户', email: 'user1@example.com', password: 'user123', variant: 'secondary' as const },
  ]

  const fillTestAccount = (email: string, password: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
  }

  if (!mounted) {
    return null // 避免水合不匹配
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>正在跳转...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">登录系统</h1>
          <p className="text-muted-foreground">
            请输入您的邮箱和密码登录案例管理系统
          </p>
        </div>

        {/* 登录表单 */}
        <Card>
          <CardHeader>
            <CardTitle>账户登录</CardTitle>
            <CardDescription>
              使用您的邮箱账户登录系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 错误提示 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      {error}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearError}
                        className="h-auto p-0 text-xs"
                      >
                        关闭
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* 邮箱字段 */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>邮箱地址</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="请输入邮箱地址"
                          disabled={isLoggingIn}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 密码字段 */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>密码</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="请输入密码"
                            disabled={isLoggingIn}
                            autoComplete="current-password"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoggingIn}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 登录按钮 */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      正在登录...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      登录
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* 测试账户 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">测试账户</CardTitle>
            <CardDescription className="text-xs">
              点击下方按钮快速填入测试账户信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={account.variant}>{account.role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {account.email}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestAccount(account.email, account.password)}
                  disabled={isLoggingIn}
                  className="text-xs"
                >
                  使用
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 返回首页链接 */}
        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
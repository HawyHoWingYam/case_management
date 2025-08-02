'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  FolderOpen,
  Plus,
  User,
  Settings,
  LogOut,
  Shield,
  Users,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { HeaderNotificationBell } from '@/components/notifications/NotificationBell'
import { cn } from '@/lib/utils'

interface HeaderProps {
  className?: string
}

// 导航项配置
const navigationItems = [
  {
    name: '首页',
    href: '/',
    icon: Home,
    roles: ['USER', 'MANAGER', 'ADMIN'],
  },
  {
    name: '案件管理',
    href: '/cases',
    icon: FolderOpen,
    roles: ['USER', 'MANAGER', 'ADMIN'],
  },
  {
    name: '创建案件',
    href: '/cases/new',
    icon: Plus,
    roles: ['USER', 'MANAGER', 'ADMIN'],
  },
  {
    name: '用户管理',
    href: '/users',
    icon: Users,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    name: '数据统计',
    href: '/analytics',
    icon: BarChart3,
    roles: ['MANAGER', 'ADMIN'],
  },
]

export default function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, hasRole, isAuthenticated } = useAuthStore()
  const { signOut, isLoggingOut } = useAuth()

  console.log('🔍 [Header] Current user state:', {
    isAuthenticated,
    user: user ? { id: user.user_id, username: user.username, role: user.role } : null
  })

  // 获取用户可访问的导航项
  const availableNavItems = navigationItems.filter(item =>
    item.roles.some(role => hasRole([role]))
  )

  // 处理登出
  const handleSignOut = async () => {
    console.log('🔍 [Header] Sign out triggered')
    setIsMobileMenuOpen(false)
    await signOut()
  }

  // 获取用户头像文字
  const getUserInitials = () => {
    if (!user?.username) return 'U'
    return user.username.slice(0, 2).toUpperCase()
  }

  // 获取角色标签
  const getRoleLabel = () => {
    const roleLabels = {
      ADMIN: '管理员',
      MANAGER: '经理',
      USER: '用户',
    }
    return user?.role ? roleLabels[user.role] || user.role : ''
  }

  // 获取角色徽章样式
  const getRoleBadgeVariant = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'destructive'
      case 'MANAGER':
        return 'default'
      case 'USER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo和品牌 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              案例管理系统
            </span>
          </Link>

          {/* 桌面端导航 */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {availableNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="gap-2"
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                )
              })}
            </nav>
          )}
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* 通知铃铛 */}
              <HeaderNotificationBell />

              {/* 用户菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">
                          {user?.username}
                        </p>
                        <Badge variant={getRoleBadgeVariant()} className="text-xs">
                          {getRoleLabel()}
                        </Badge>
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      个人资料
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  
                  {hasRole(['ADMIN']) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        系统管理
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? '登出中...' : '登出'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 移动端菜单 */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="md:hidden h-9 w-9 p-0"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">打开菜单</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle>导航菜单</SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex flex-col gap-4 mt-6">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{user?.username}</span>
                          <Badge variant={getRoleBadgeVariant()} className="text-xs">
                            {getRoleLabel()}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>

                    {/* 导航链接 */}
                    <nav className="flex flex-col gap-1">
                      {availableNavItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            className="justify-start gap-3 h-10"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link href={item.href}>
                              <Icon className="h-4 w-4" />
                              {item.name}
                            </Link>
                          </Button>
                        )
                      })}
                    </nav>

                    {/* 分隔符 */}
                    <div className="border-t" />

                    {/* 其他功能 */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-10"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/profile">
                          <User className="h-4 w-4" />
                          个人资料
                        </Link>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-10"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/settings">
                          <Settings className="h-4 w-4" />
                          设置
                        </Link>
                      </Button>

                      {hasRole(['ADMIN']) && (
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 h-10"
                          asChild
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/admin">
                            <Shield className="h-4 w-4" />
                            系统管理
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* 分隔符 */}
                    <div className="border-t" />

                    {/* 登出 */}
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-10 text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? '登出中...' : '登出'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            /* 未登录状态 */
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild>
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
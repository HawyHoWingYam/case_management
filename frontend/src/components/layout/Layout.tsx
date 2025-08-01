'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Home, FileText, Users, Settings, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { RequireRole } from '@/components/auth/RoleGuard'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: '首页', href: '/', icon: Home, roles: [] }, // 所有人可访问
  { name: '案例管理', href: '/cases', icon: FileText, roles: ['ADMIN', 'MANAGER', 'USER'] },
  { name: '用户管理', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: '设置', href: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { user, isAuthenticated } = useAuthStore()
  const { signOut, isLoggingOut } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取用户角色的显示文本
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': '管理员',
      'MANAGER': '经理',
      'USER': '用户',
    }
    return roleMap[role] || role
  }

  // 获取用户角色的颜色
  const getRoleVariant = (role: string) => {
    const variantMap: Record<string, 'destructive' | 'default' | 'secondary'> = {
      'ADMIN': 'destructive',
      'MANAGER': 'default',
      'USER': 'secondary',
    }
    return variantMap[role] || 'default'
  }

  // 检查用户是否可以访问某个导航项
  const canAccessNavItem = (roles: string[]) => {
    if (roles.length === 0) return true // 公开访问
    if (!isAuthenticated || !user) return false
    return roles.includes(user.role)
  }

  // 处理登出
  const handleLogout = async () => {
    await signOut()
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation
        .filter(item => canAccessNavItem(item.roles))
        .map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                mobile
                  ? 'flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium'
                  : 'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium'
              } ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } transition-colors`}
              onClick={() => mobile && setIsMobileMenuOpen(false)}
            >
              <item.icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
              <span>{item.name}</span>
            </Link>
          )
        })}
    </>
  )

  // 如果组件还未挂载，不渲染以避免水合错误
  if (!mounted) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden font-bold sm:inline-block">
                案例管理系统
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              <NavLinks />
            </nav>
          )}

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                          <Badge variant={getRoleVariant(user.role)} className="w-fit text-xs mt-1">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>个人资料</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>设置</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isLoggingOut ? '登出中...' : '登出'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">打开菜单</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col space-y-4 mt-4">
                      <div className="flex items-center space-x-2 px-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          <Badge variant={getRoleVariant(user.role)} className="text-xs mt-1">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <nav className="flex flex-col space-y-1">
                          <NavLinks mobile />
                        </nav>
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            个人资料
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-red-600 hover:text-red-600"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {isLoggingOut ? '登出中...' : '登出'}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              // 未登录状态显示登录按钮
              <Link href="/login">
                <Button size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  登录
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 px-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2025 案例管理系统. 保留所有权利.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              隐私政策
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              使用条款
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, FileText, Users, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '案例管理', href: '/cases', icon: FileText },
  { name: '用户管理', href: '/users', icon: Users },
  { name: '设置', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
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
          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </nav>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="hidden sm:flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt="用户头像" />
                <AvatarFallback>用户</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
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
                      <AvatarImage src="/placeholder-avatar.jpg" alt="用户头像" />
                      <AvatarFallback>用户</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">用户名</p>
                      <p className="text-xs text-muted-foreground">
                        user@example.com
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <nav className="flex flex-col space-y-1">
                      <NavLinks mobile />
                    </nav>
                  </div>
                  <div className="border-t pt-4">
                    <Button variant="ghost" className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      退出登录
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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
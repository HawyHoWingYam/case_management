// frontend/src/app/layout.tsx
'use client'

import { Inter } from 'next/font/google'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import './globals.css'
import Layout from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'

const inter = Inter({ subsets: ['latin'] })

// 如果你希望每个用户会话都有独立的查询客户端，可以使用这种方式
// 但通常共享一个全局客户端就足够了
function QueryProvider({ children }: { children: React.ReactNode }) {
  // 使用 useState 确保 QueryClient 只在客户端创建一次
  const [client] = useState(() => queryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* 开发环境下显示 React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// 元数据配置
const metadata = {
  title: '案例管理系统',
  description: '一个现代化的案例管理系统，用于高效处理和追踪各类案例',
  keywords: ['案例管理', '工作流', '任务追踪'],
}

// 设置文档标题
if (typeof document !== 'undefined') {
  document.title = metadata.title
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords.join(', ')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="案例管理系统团队" />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <Layout>
            {children}
          </Layout>
          
          {/* Toast 通知系统 */}
          <Toaster 
            richColors 
            position="top-right"
            expand={true}
            duration={4000}
            closeButton={true}
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
          
          {/* 全局错误边界和加载状态可以在这里添加 */}
          <ErrorBoundary />
        </QueryProvider>
      </body>
    </html>
  )
}

// 简单的错误边界组件
function ErrorBoundary() {
  // 在生产环境中，你可能想要一个更完整的错误边界
  // 这里只是一个占位符
  return null
}

// 如果你需要服务端渲染支持，可以使用这个版本：
/*
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '案例管理系统',
  description: '一个现代化的案例管理系统，用于高效处理和追踪各类案例',
  keywords: ['案例管理', '工作流', '任务追踪'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ClientProviders>
          <Layout>{children}</Layout>
          <Toaster richColors position="top-right" />
        </ClientProviders>
      </body>
    </html>
  )
}

// 客户端提供者组件
'use client'
function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
*/
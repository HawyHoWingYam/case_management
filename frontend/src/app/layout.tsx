import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

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
        <Layout>{children}</Layout>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
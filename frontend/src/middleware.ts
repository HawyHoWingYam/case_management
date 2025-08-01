import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 需要保护的路由
const protectedRoutes = [
  '/cases',
  '/users',
  '/settings',
  '/profile',
  '/dashboard',
]

// 公开路由（不需要认证）
const publicRoutes = [
  '/login',
  '/register', // 如果以后添加注册功能
  '/', // 首页允许访问，但可能有条件显示
]

// 管理员专用路由
const adminRoutes = [
  '/users',
  '/settings',
]

// 经理及以上权限路由
const managerRoutes = [
  '/cases/analytics',
  '/reports',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 获取认证信息（从 cookie 或 localStorage，这里我们检查 cookie）
  const authCookie = request.cookies.get('auth-storage')
  let isAuthenticated = false
  let userRole = null

  // 尝试解析认证信息
  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value)
      isAuthenticated = authData.state?.isAuthenticated || false
      userRole = authData.state?.user?.role || null
    } catch (error) {
      // 解析失败，视为未认证
      isAuthenticated = false
    }
  }

  // 如果是公开路由，允许访问
  if (publicRoutes.includes(pathname)) {
    // 如果已登录用户访问登录页，重定向到首页
    if (pathname === '/login' && isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 检查是否为受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    // 保存用户尝试访问的页面，登录后重定向
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('redirectAfterLogin', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 分钟
    })
    return response
  }

  // 检查管理员权限
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 检查经理权限
  const isManagerRoute = managerRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isManagerRoute && !['ADMIN', 'MANAGER'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api 路由
     * - _next/static (静态文件)
     * - _next/image (图像优化)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
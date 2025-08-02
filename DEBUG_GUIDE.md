# 案例管理系统 - 调试指南

## 系统状态 ✅

**前端服务**: http://localhost:3000 (或 3002)  
**后端服务**: http://localhost:3001  
**API文档**: http://localhost:3001/api/docs  

## 调试日志系统

我们为整个应用程序添加了全面的调试日志系统，方便开发者进行问题排查和功能验证。

### 日志标记说明

所有日志都使用表情符号标记来快速识别组件和功能：

- 🔐 **[AuthStore/useAuth]** - 认证相关操作
- 🔍 **[Layout/Header]** - 页面布局和导航
- 🔔 **[NotificationBell/Store]** - 通知系统
- 🏥 **[HealthStatus]** - 系统健康检查
- 🔍 **[API]** - API 请求和响应

### 前端调试日志

#### 认证系统 (🔐)
```javascript
// AuthStore 登录/登出操作
🔐 [AuthStore] Login action: { userId: 1, username: "admin", role: "ADMIN" }
🔐 [AuthStore] Logout action

// useAuth Hook 操作
🔐 [useAuth] Sign in attempt: { email: "user@example.com" }
🔐 [useAuth] Login successful: { userId: 1, username: "admin", role: "ADMIN" }
🔐 [useAuth] Sign out initiated
```

#### 页面布局 (🔍)
```javascript
// Layout 组件认证检查
🔍 [Layout] Current state: { pathname: "/", isAuthenticated: true, hasUser: true }
🔍 [Layout] Authentication check: { isAuthenticated: true, isPublicPath: false }

// Header 组件状态
🔍 [Header] Current user state: { isAuthenticated: true, user: { id: 1, username: "admin" } }
```

#### 通知系统 (🔔)
```javascript
// 通知铃铛组件
🔔 [NotificationBell] Component mounted
🔔 [NotificationBell] Toggle popover: true
🔔 [NotificationBell] Notification clicked: 123

// 通知状态管理
🔔 [NotificationStore] Set notifications: { total: 5, unread: 2 }
🔔 [NotificationStore] Added notification: { id: 124, type: "CASE_ASSIGNED" }
```

#### 系统健康 (🏥)
```javascript
// 健康检查组件
🏥 [HealthStatus] Component mounted, starting health check
🏥 [HealthStatus] Health data received: { status: "ok", uptime: 1234 }
🏥 [HealthStatus] Health check failed: Connection refused
```

#### API 请求 (🔍)
```javascript
// API 客户端请求/响应
🔍 [API] Request: { method: "POST", url: "/auth/login", hasAuth: false }
🔍 [API] Response: { status: 200, url: "/auth/login", data: "Has data" }
🔍 [API] Error: { status: 401, url: "/auth/profile", error: "Unauthorized" }
```

### 后端调试日志

#### 认证服务
```typescript
// AuthService 验证和登录
[AuthService] Login attempt with email: user@example.com
[AuthService] User profile request for user: 1

// AuthController 端点访问
[AuthController] Login attempt for email: user@example.com
[AuthController] Profile request for user: 1
```

#### 案例管理
```typescript
// CasesService 操作
[CasesService] Creating case with DTO: { title: "新案例", assigned_to: 2 }
[CasesService] Fetching cases with filters: { status: "OPEN", page: 1 }

// CasesController 端点
[CasesController] Creating new case for user: 1
[CasesController] User 2 accepting case: 5
```

#### 通知服务
```typescript
// NotificationsService
[NotificationsService] Creating notification for user 2
[NotificationsService] Fetching notifications for user 1
[NotificationsService] Marking notification 123 as read
```

### 调试技巧

#### 1. 查看浏览器控制台
打开浏览器开发者工具 (F12)，在 Console 标签页查看前端日志：
```javascript
// 过滤特定组件的日志
console.log 过滤: "🔐" (只看认证相关)
console.log 过滤: "🔔" (只看通知相关)
```

#### 2. 查看后端终端日志
在运行 `npm run start:dev` 的终端中查看后端日志：
```bash
# 运行后端并查看日志
cd backend
npm run start:dev

# 查看特定服务的日志
grep "AuthService" # 认证服务日志
grep "CasesService" # 案例服务日志
```

#### 3. 使用健康检查脚本
```bash
# 运行系统健康检查
./health-check.sh
```

#### 4. API 测试
访问 http://localhost:3001/api/docs 使用 Swagger 文档测试 API 端点

### 常见问题排查

#### 认证问题
1. 检查 🔐 标记的日志
2. 验证 token 是否正确设置
3. 检查 API 请求是否包含 Authorization header

#### 页面加载问题
1. 检查 🔍 [Layout] 日志中的认证状态
2. 验证路由重定向逻辑
3. 检查组件挂载和卸载日志

#### 通知问题
1. 查看 🔔 标记的前端日志
2. 检查后端 NotificationsService 日志
3. 验证 WebSocket 连接状态（如果使用）

#### API 连接问题
1. 检查 🔍 [API] 请求和响应日志
2. 验证后端服务是否运行在正确端口
3. 检查 CORS 设置

### 开发环境调试信息

在开发环境中，页面左下角会显示调试信息面板，包含：
- 当前路径
- 认证状态  
- 用户信息
- 权限信息
- 页面状态

这些调试功能帮助开发者快速识别和解决问题！
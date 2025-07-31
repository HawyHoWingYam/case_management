# 階段 5: 測試、部署與交付 (Testing, Deployment & Handoff)

## 目標
此階段是確保應用程式品質、順利上線並交付給最終使用者的最後階段，包含全面測試、生產部署和專案交接。

## 技術要求
- **測試框架**: Jest, React Testing Library, Cypress
- **容器化**: Docker, Docker Compose
- **雲端平台**: Vercel (前端), AWS/GCP (後端)
- **監控**: Sentry, LogRocket, New Relic
- **CI/CD**: GitHub Actions, GitLab CI
- **文件**: Swagger/OpenAPI, Storybook

## 開發步驟

### 步驟 5.1: 使用者驗收測試 (UAT)

**目標**: 確保應用程式滿足所有業務需求和使用者期望

**實作內容**:
- 制定詳細測試腳本
- 建立測試環境
- 執行跨平台測試
- 收集並處理使用者回饋

**測試腳本規劃**:

#### Clerk 角色測試腳本
```markdown
### Clerk 功能測試

**測試環境**: Chrome, Firefox, Safari (桌面) + iOS Safari, Android Chrome (行動)

1. **登入系統**
   - [ ] 使用有效憑證登入
   - [ ] 確認角色識別正確
   - [ ] 驗證主畫面載入

2. **新建案件功能**
   - [ ] 填寫完整案件資訊
   - [ ] 上傳多種格式附件 (PDF, DOC, JPG)
   - [ ] 驗證必填欄位檢查
   - [ ] 確認提交成功訊息
   - [ ] 檢查案件狀態為 "Pending Review"

3. **案件列表檢視**
   - [ ] 查看已提交案件
   - [ ] 驗證篩選功能
   - [ ] 測試搜尋功能
   - [ ] 確認分頁載入

4. **響應式設計**
   - [ ] 手機版介面正常
   - [ ] 平板版佈局適當
   - [ ] 觸控操作流暢
```

#### Chair 角色測試腳本
```markdown
### Chair 功能測試

1. **案件審核流程**
   - [ ] 檢視待審核案件列表
   - [ ] 開啟案件詳細資訊
   - [ ] 下載並檢視附件
   - [ ] 指派案件給 Caseworker
   - [ ] 驗證指派通知發送

2. **最終審批功能**
   - [ ] 審核完成請求
   - [ ] 批准案件完成
   - [ ] 拒絕案件 (含拒絕原因)
   - [ ] 確認狀態更新正確

3. **報告功能**
   - [ ] 存取儀表板
   - [ ] 檢視各類統計圖表
   - [ ] 匯出報告資料
   - [ ] Power BI 報告載入
```

#### Caseworker 角色測試腳本
```markdown
### Caseworker 功能測試

1. **案件接收流程**
   - [ ] 接收指派通知
   - [ ] 檢視指派案件
   - [ ] 接受案件 (驗證工作量限制)
   - [ ] 確認狀態更新

2. **案件處理功能**
   - [ ] 添加處理日誌
   - [ ] 上傳補充文件
   - [ ] 請求案件完成
   - [ ] 填寫完成備註

3. **個人工作區**
   - [ ] 檢視個人案件列表
   - [ ] 確認工作量統計
   - [ ] 案件優先級排序
```

**UAT 環境設定**:
```yaml
# docker-compose.uat.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - NEXT_PUBLIC_API_URL=https://api-uat.example.com
    ports:
      - "3000:3000"
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=uat
      - DATABASE_URL=postgresql://uat_user:password@db:5432/case_management_uat
    ports:
      - "3001:3001"
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=case_management_uat
      - POSTGRES_USER=uat_user
      - POSTGRES_PASSWORD=password
    volumes:
      - uat_db_data:/var/lib/postgresql/data
```

### 步驟 5.2: 錯誤修復與優化

**目標**: 根據 UAT 回饋進行全面的錯誤修復和效能優化

**實作內容**:
- 建立錯誤追蹤系統
- 效能瓶頸分析與優化
- 安全性漏洞修復
- 使用者體驗改善

**錯誤追蹤與監控**:
```typescript
// Sentry 錯誤監控設定
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // 過濾敏感資訊
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  }
});
```

**效能優化檢查清單**:
- [ ] Bundle 大小分析與優化
- [ ] 圖片壓縮與 lazy loading
- [ ] API 回應時間優化 (< 200ms)
- [ ] 資料庫查詢最佳化
- [ ] CDN 設定與靜態資源快取
- [ ] 程式碼分割 (Code Splitting)

**安全性檢查**:
```typescript
// 安全性中介層範例
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 設定安全標頭
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// API 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);
```

### 步驟 5.3: 正式部署

**目標**: 建立穩定、可擴展的生產環境部署

**實作內容**:
- 容器化應用程式
- 設定 CI/CD 管道
- 配置生產環境
- 建立監控系統

#### 前端部署 (Vercel)

**vercel.json 設定**:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com",
    "NEXT_PUBLIC_SENTRY_DSN": "@sentry-dsn"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

#### 後端部署 (Docker + AWS ECS)

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

**docker-compose.prod.yml**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
    depends_on:
      - redis
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### CI/CD 管道 (GitHub Actions)

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production --service case-management --force-new-deployment
```

### 步驟 5.4: 專案交付

**目標**: 完成專案正式交接，確保業務方能夠順利接手

**實作內容**:
- 撰寫完整文件
- 進行使用者培訓
- 建立支援機制
- 專案總結會議

#### 使用者手冊

**結構規劃**:
```markdown
# 案件管理系統使用者手冊

## 目錄
1. 系統概述
2. 登入與基本操作
3. 角色功能詳解
   - 3.1 Clerk 操作指南
   - 3.2 Chair 管理指南  
   - 3.3 Caseworker 處理指南
4. 報告功能使用
5. 常見問題解答
6. 故障排除
7. 聯絡資訊
```

#### 管理員手冊

**內容包含**:
- 系統架構說明
- 部署與維護指南
- 資料備份程序
- 安全設定檢查清單
- 效能監控指南
- 故障排除手冊

#### 技術文件

**API 文件 (Swagger)**:
```typescript
// swagger.config.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Case Management API')
  .setDescription('案件管理系統 API 文件')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export const swaggerConfig = config;
```

**前端元件文件 (Storybook)**:
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport'
  ]
};
```

## 部署後監控

### 系統監控設定
```typescript
// 健康檢查端點
@Get('/health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    redis: 'connected'
  };
}
```

### 日誌管理
```typescript
// 結構化日誌
import { Logger } from '@nestjs/common';

Logger.log({
  level: 'info',
  message: 'Case created successfully',
  caseId: 'uuid',
  userId: 'uuid',
  timestamp: new Date().toISOString()
});
```

## 交付檢查清單

### 技術交付
- [ ] 原始碼移交 (含 Git 歷史)
- [ ] 部署腳本與設定檔
- [ ] 資料庫結構與初始資料
- [ ] API 文件與測試集合
- [ ] 監控與警報設定

### 文件交付
- [ ] 使用者操作手冊
- [ ] 系統管理員手冊
- [ ] 技術架構文件
- [ ] 部署指南
- [ ] 故障排除手冊

### 培訓交付
- [ ] 最終使用者培訓
- [ ] 系統管理員培訓
- [ ] 開發團隊知識轉移
- [ ] 支援流程建立

### 品質保證
- [ ] 所有測試通過
- [ ] 效能指標達標
- [ ] 安全檢查完成
- [ ] 使用者驗收簽核
- [ ] 上線穩定性確認

## 後續支援計畫

### 保固期支援 (3個月)
- 錯誤修復
- 小幅功能調整
- 技術支援
- 使用者訓練

### 維護建議
- 定期安全更新
- 效能監控與優化
- 資料備份驗證
- 使用者回饋收集

## 完成標準
- [ ] UAT 100% 通過
- [ ] 生產環境穩定運行
- [ ] 所有文件交付完成
- [ ] 使用者培訓完成
- [ ] 業務方正式驗收
- [ ] 支援機制建立
- [ ] 專案正式結案
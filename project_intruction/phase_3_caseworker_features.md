# 階段 3: Caseworker 功能與進階介面開發

## 目標
此階段將完成所有角色的前端介面，並將其與 NestJS 後端 API 完全對接，建立完整的案件處理工作流程。

## 技術要求
- **前端框架**: Next.js with React
- **UI 框架**: Tailwind CSS / Material-UI
- **狀態管理**: React Context / Redux Toolkit
- **表單管理**: React Hook Form
- **HTTP 客戶端**: Axios / Fetch API
- **響應式設計**: Mobile-first approach

## 開發步驟

### 步驟 3.1: 開發 Caseworker 個人化視圖

**目標**: 建立 Caseworker 專屬的案件管理介面

**實作內容**:
- 建立角色型導航系統
- 開發 Caseworker 儀表板
- 實現個人化案件篩選
- 建立工作量指示器

**前端元件**:
```typescript
// CaseworkerDashboard.tsx
interface CaseworkerDashboardProps {
  userId: string;
  role: 'Caseworker';
}

// 需要實現的功能:
- 顯示指派給我的案件 (Assigned)
- 顯示進行中的案件 (In Progress)
- 顯示待審核完成的案件 (Pending Completion Review)
- 工作量統計 (x/5 案件處理中)
- 快速操作按鈕
```

**API 整合**:
- `GET /cases/caseworker/:userId` - 取得個人案件列表
- `GET /users/:userId/workload` - 取得工作量統計

**響應式設計要求**:
- 桌面版: 3欄式佈局 (導航、案件列表、詳細資訊)
- 平板版: 2欄式佈局 (可摺疊導航)
- 手機版: 單欄堆疊式佈局

### 步驟 3.2: 實現 Caseworker 案件操作

**目標**: 建立 Caseworker 的核心操作功能

**實作內容**:
- 開發案件詳細資訊頁面
- 實現「Accept Case」功能
- 實現「Request Case Completion」功能
- 建立檔案檢視器

**核心元件開發**:

#### CaseDetailView 元件
```typescript
interface CaseDetailViewProps {
  caseId: string;
  userRole: UserRole;
  userId: string;
}

// 需要顯示的資訊:
- 案件基本資訊 (標題、描述、優先級)
- 提交者資訊
- 指派資訊
- 案件狀態歷史
- 附件檔案
- 操作按鈕 (依據角色和狀態)
```

#### AcceptCaseButton 元件
```typescript
const AcceptCaseButton: React.FC<{
  caseId: string;
  onAccept: () => void;
  disabled: boolean;
}> = ({ caseId, onAccept, disabled }) => {
  // 處理接受案件邏輯
  // 呼叫 POST /cases/:caseId/accept API
  // 顯示確認對話框
  // 處理工作量超限錯誤
};
```

#### RequestCompletionButton 元件
```typescript
const RequestCompletionButton: React.FC<{
  caseId: string;
  onRequest: () => void;
}> = ({ caseId, onRequest }) => {
  // 開啟完成請求對話框
  // 包含備註輸入欄位
  // 呼叫 POST /cases/:caseId/request-completion API
};
```

**錯誤處理**:
- 工作量超限提示
- 網路錯誤重試機制
- 樂觀更新與回滾

### 步驟 3.3: 實現 Chair 最終審批功能

**目標**: 完成 Chair 的案件審批工作流程

**實作內容**:
- 擴展 Chair 案件詳細頁面
- 新增最終審批按鈕
- 實現案件拒絕功能
- 建立審批歷史記錄

**Chair 專屬功能**:

#### ApproveCaseCompletionButton 元件
```typescript
const ApproveCaseCompletionButton: React.FC<{
  caseId: string;
  onApprove: () => void;
}> = ({ caseId, onApprove }) => {
  // 確認對話框
  // 呼叫 POST /cases/:caseId/approve-completion API
  // 更新案件狀態為 "Completed"
  // 發送完成通知
};
```

#### RejectCaseButton 元件
```typescript
const RejectCaseButton: React.FC<{
  caseId: string;
  onReject: (reason: string) => void;
}> = ({ caseId, onReject }) => {
  // 拒絕原因輸入對話框
  // 呼叫 POST /cases/:caseId/reject API
  // 狀態回退到適當階段
  // 發送拒絕通知
};
```

**需要的新 API 端點**:
- `POST /cases/:caseId/approve-completion`
- `POST /cases/:caseId/reject`
- `GET /cases/pending-review` - Chair 待審核列表

### 步驟 3.4: 實現手動添加日誌功能

**目標**: 建立完整的案件日誌系統

**實作內容**:
- 開發日誌輸入元件
- 建立日誌歷史檢視
- 實現即時日誌更新
- 加入日誌搜尋功能

**日誌系統元件**:

#### AddLogEntry 元件
```typescript
const AddLogEntry: React.FC<{
  caseId: string;
  userId: string;
  onLogAdded: () => void;
}> = ({ caseId, userId, onLogAdded }) => {
  // 備註輸入表單
  // 呼叫 POST /cases/:caseId/logs API
  // 即時更新日誌列表
};
```

#### CaseLogHistory 元件
```typescript
const CaseLogHistory: React.FC<{
  caseId: string;
}> = ({ caseId }) => {
  // 時間軸式日誌檢視
  // 自動重新整理
  // 支援分頁載入
  // 操作者資訊顯示
};
```

**API 整合**:
- `POST /cases/:caseId/logs` - 新增日誌
- `GET /cases/:caseId/logs` - 取得日誌歷史

## 使用者體驗優化

### 即時更新系統
- 使用 WebSocket 或 Server-Sent Events
- 案件狀態變更即時推送
- 新指派案件即時通知

### 載入狀態管理
- Skeleton loading 元件
- 分段載入大量資料
- 錯誤邊界處理

### 離線支援
- 基本資料快取
- 離線操作佇列
- 網路恢復時同步

## 權限控制

### 前端權限檢查
```typescript
const usePermissions = (userRole: UserRole, caseStatus: CaseStatus) => {
  return {
    canAcceptCase: userRole === 'Caseworker' && caseStatus === 'Assigned',
    canRequestCompletion: userRole === 'Caseworker' && caseStatus === 'In Progress',
    canApproveCompletion: userRole === 'Chair' && caseStatus === 'Pending Completion Review',
    canRejectCase: userRole === 'Chair',
    canAddLog: ['Clerk', 'Chair', 'Caseworker'].includes(userRole)
  };
};
```

### 後端權限驗證
- JWT Token 驗證
- 角色型存取控制 (RBAC)
- 操作權限中介層

## 測試要求

### 單元測試
- React 元件測試 (Jest + React Testing Library)
- 權限邏輯測試
- API 整合測試

### 整合測試
- 端對端使用者流程測試
- 跨瀏覽器相容性測試
- 響應式設計測試

### 使用者測試
- 角色型功能測試
- 工作流程測試
- 效能測試

## 完成標準
- [ ] 所有角色介面完整實現
- [ ] API 整合正常運作
- [ ] 響應式設計達標
- [ ] 權限控制正確
- [ ] 使用者體驗流暢
- [ ] 錯誤處理完善
- [ ] 測試覆蓋率 > 85%
- [ ] 跨瀏覽器相容
- [ ] 效能指標達標
- [ ] 使用者驗收測試通過
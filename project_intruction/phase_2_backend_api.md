# 階段 2: 工作流程與邏輯實現 (NestJS 後端 API)

## 目標
此階段將專注於在 NestJS 中實現所有業務邏輯，將其封裝在結構化的控制器(Controllers)與服務(Services)中。

## 技術要求
- **框架**: NestJS with TypeScript
- **ORM**: TypeORM 或 Prisma
- **資料庫**: PostgreSQL
- **檔案儲存**: AWS S3
- **郵件服務**: 整合郵件通知系統

## 開發步驟

### 步驟 2.1: 案件提交與狀態更新邏輯

**目標**: 建立完整的案件創建與狀態管理系統

**實作內容**:
- 在 `CaseController` 中建立 `POST /cases` API 端點
- 開發 `CaseService` 中的案件創建方法
- 實現以下功能：
  - 資料驗證與清理
  - 案件存入資料庫
  - 自動狀態更新為 "Pending Review"
  - 檔案上傳處理 (整合 AWS S3)
  - 在 `Case_Log` 表中新增首筆日誌記錄

**API 規格**:
```typescript
POST /cases
Content-Type: multipart/form-data

Request Body:
- title: string
- description: string
- priority: enum ['Low', 'Medium', 'High']
- files: File[]
- submittedBy: string (User ID)

Response:
{
  "id": "uuid",
  "status": "Pending Review",
  "createdAt": "timestamp",
  "message": "Case created successfully"
}
```

### 步驟 2.2: 案件指派與通知 API

**目標**: 實現 Chair 指派案件給 Caseworker 的完整流程

**實作內容**:
- 建立 `PUT /cases/:caseId/assign` API 端點
- 在 `CaseService` 中實現指派邏輯
- 整合郵件通知服務
- 實現以下功能：
  - 更新 `AssignedCaseworkerID` 欄位
  - 狀態更新為 "Assigned"
  - 發送郵件通知給被指派的 Caseworker
  - 記錄指派日誌

**API 規格**:
```typescript
PUT /cases/:caseId/assign

Request Body:
{
  "caseworkerId": "uuid",
  "assignedBy": "uuid" // Chair ID
}

Response:
{
  "success": true,
  "assignedTo": "caseworker_email",
  "notificationSent": true
}
```

### 步驟 2.3: Caseworker 接受案件 API (含業務規則)

**目標**: 實現 Caseworker 接受案件的業務邏輯與限制

**實作內容**:
- 建立 `POST /cases/:caseId/accept` API 端點
- 實現工作量限制業務規則
- 開發案件接受邏輯
- 實現以下功能：
  - 查詢 Caseworker 當前處理中案件數量
  - 驗證是否超過工作量上限 (預設: 5件)
  - 如未超限，更新案件狀態為 "In Progress"
  - 記錄接受案件的日誌
  - 發送確認郵件

**API 規格**:
```typescript
POST /cases/:caseId/accept

Request Body:
{
  "caseworkerId": "uuid"
}

Response:
{
  "success": true,
  "status": "In Progress",
  "currentWorkload": 3,
  "maxWorkload": 5
} | {
  "success": false,
  "error": "Workload limit exceeded",
  "currentWorkload": 5,
  "maxWorkload": 5
}
```

### 步驟 2.4: 請求完成與通知 API

**目標**: 實現 Caseworker 請求案件完成的流程

**實作內容**:
- 建立 `POST /cases/:caseId/request-completion` API 端點
- 實現完成請求邏輯
- 整合 Chair 通知系統
- 實現以下功能：
  - 狀態更新為 "Pending Completion Review"
  - 記錄完成請求日誌
  - 發送郵件通知給 Chair
  - 更新案件完成時間戳記

**API 規格**:
```typescript
POST /cases/:caseId/request-completion

Request Body:
{
  "caseworkerId": "uuid",
  "completionNotes": "string"
}

Response:
{
  "success": true,
  "status": "Pending Completion Review",
  "reviewRequestSent": true,
  "chairNotified": true
}
```

## 資料庫架構更新

### Case 表新增欄位
- `AssignedCaseworkerID`: UUID (Foreign Key to User)
- `CompletionRequestedAt`: Timestamp
- `CompletionNotes`: Text

### Case_Log 表結構
- `ID`: UUID (Primary Key)
- `CaseID`: UUID (Foreign Key)
- `Action`: Enum ['Created', 'Assigned', 'Accepted', 'Completion Requested', 'Completed', 'Rejected']
- `PerformedBy`: UUID (Foreign Key to User)
- `Timestamp`: DateTime
- `Notes`: Text

## 錯誤處理

### 常見錯誤情境
1. **案件不存在**: 返回 404 Not Found
2. **權限不足**: 返回 403 Forbidden
3. **工作量超限**: 返回 400 Bad Request
4. **檔案上傳失敗**: 返回 500 Internal Server Error
5. **郵件發送失敗**: 記錄日誌但不阻止主要流程

## 測試要求

### 單元測試
- 每個 Service 方法的單元測試
- 業務邏輯驗證測試
- 錯誤處理測試

### 整合測試
- API 端點測試
- 資料庫操作測試
- 檔案上傳測試
- 郵件發送測試

## 完成標準
- [ ] 所有 API 端點正常運作
- [ ] 業務邏輯正確實現
- [ ] 錯誤處理完善
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] API 文件完整
- [ ] 程式碼審查通過
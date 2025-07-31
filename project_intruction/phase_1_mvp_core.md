# 階段 1: 核心 App 開發 (MVP)
## MVP Core Development - Clerk & Chair 功能

### 🎯 階段目標
建立最小可行性產品(MVP)，讓核心的案件創建和審核流程能夠運作。專注於 Clerk 和 Chair 兩個主要角色的基本功能實現。

### ⏱️ 預估時間
**3-4 週**

### 🔗 前置條件
- [階段 0: 基礎建設](./phase_0_foundation.md) 完成
- 開發環境正常運行
- 資料庫連線正常
- AWS S3 設定完成

---

## 📋 主要任務清單

### ✅ 步驟 1.1: 初始化 Next.js 應用程式架構

#### 專案結構規劃
- [ ] **建立 App Router 結構**

```
src/
├── app/
│   ├── layout.tsx          # 全域佈局
│   ├── page.tsx            # 首頁/儀表板
│   ├── cases/              # 案件相關路由
│   │   ├── page.tsx        # 案件列表
│   │   ├── new/            # 新建案件
│   │   │   └── page.tsx
│   │   └── [id]/           # 案件詳情
│   │       └── page.tsx
│   ├── auth/               # 身份驗證
│   │   ├── login/
│   │   └── register/
│   └── api/                # API 路由 (Next.js API)
├── components/             # 共用元件
├── hooks/                  # 自定義 Hooks
├── lib/                    # 工具函數
├── types/                  # TypeScript 型別定義
└── styles/                 # 樣式檔案
```

- [ ] **建立基礎元件架構**

```typescript
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Clerk' | 'Chair' | 'Caseworker';
}

export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'New' | 'Pending Review' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  created_by: User;
  assigned_caseworker?: User;
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
}
```

#### 全域佈局設定
- [ ] **建立響應式佈局**

```tsx
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <Header />
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **建立導航側邊欄**

```tsx
// src/components/Sidebar.tsx
export function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:translate-x-0">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold">案件管理系統</h1>
      </div>
      <nav className="mt-6">
        <SidebarLink href="/" icon={HomeIcon}>
          儀表板
        </SidebarLink>
        <SidebarLink href="/cases" icon={FolderIcon}>
          案件管理
        </SidebarLink>
        <SidebarLink href="/reports" icon={ChartBarIcon}>
          報告分析
        </SidebarLink>
      </nav>
    </div>
  );
}
```

---

### ✅ 步驟 1.2: 設計統一且響應式的主畫面

#### 儀表板開發
- [ ] **建立主儀表板**

```tsx
// src/app/page.tsx
export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          歡迎回來，{user?.name}
        </h1>
        {user?.role === 'Clerk' && (
          <Link
            href="/cases/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            新建案件
          </Link>
        )}
      </div>
      
      <DashboardStats />
      <CasesList />
    </div>
  );
}
```

- [ ] **實現角色權限控制**

```tsx
// src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    const permissions = {
      'Clerk': ['create_case', 'view_own_cases'],
      'Chair': ['view_all_cases', 'assign_cases', 'approve_cases'],
      'Caseworker': ['view_assigned_cases', 'update_case_status']
    };
    
    return permissions[user.role]?.includes(permission) || false;
  };
  
  return { user, hasPermission };
}
```

#### 案件列表元件
- [ ] **建立響應式案件列表**

```tsx
// src/components/CasesList.tsx
export function CasesList() {
  const { user } = useAuth();
  const { data: cases, loading } = useCases();
  
  if (loading) return <CasesListSkeleton />;
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          案件列表
        </h3>
        
        {/* 桌面版表格 */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th>案件標題</th>
                <th>狀態</th>
                <th>優先級</th>
                <th>建立日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((case_) => (
                <CaseTableRow key={case_.id} case={case_} />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 手機版卡片 */}
        <div className="md:hidden space-y-4">
          {cases.map((case_) => (
            <CaseCard key={case_.id} case={case_} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### ✅ 步驟 1.3: 開發「新建案件」功能 (Clerk)

#### 案件建立表單
- [ ] **建立案件輸入頁面**

```tsx
// src/app/cases/new/page.tsx
export default function NewCasePage() {
  const { register, handleSubmit, formState: { errors } } = useForm<CaseFormData>();
  const { mutate: createCase, isLoading } = useCreateCase();
  
  const onSubmit = async (data: CaseFormData) => {
    try {
      await createCase(data);
      router.push('/cases');
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold mb-6">新建案件</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField label="案件標題" error={errors.title}>
              <input
                {...register('title', { required: '案件標題為必填' })}
                className="form-input"
                placeholder="請輸入案件標題"
              />
            </FormField>
            
            <FormField label="案件描述" error={errors.description}>
              <textarea
                {...register('description', { required: '案件描述為必填' })}
                rows={4}
                className="form-textarea"
                placeholder="請詳細描述案件內容"
              />
            </FormField>
            
            <FormField label="優先級">
              <select {...register('priority')} className="form-select">
                <option value="Low">低</option>
                <option value="Medium">中</option>
                <option value="High">高</option>
                <option value="Urgent">緊急</option>
              </select>
            </FormField>
            
            <FormField label="截止日期">
              <input
                {...register('due_date')}
                type="date"
                className="form-input"
              />
            </FormField>
            
            <FileUpload onUpload={handleFileUpload} />
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? '建立中...' : '建立案件'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

#### 檔案上傳功能
- [ ] **實現檔案上傳元件**

```tsx
// src/components/FileUpload.tsx
export function FileUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).filter(file => {
      // 檔案類型檢查
      const allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx'];
      // 檔案大小檢查 (10MB)
      return file.size <= 10 * 1024 * 1024;
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    onUpload(newFiles);
  };
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        附件檔案
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          拖拽檔案到此處，或
          <button type="button" className="text-blue-600 hover:text-blue-500">
            點擊選擇檔案
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          支援 PDF, DOC, DOCX, 圖片檔案，最大 10MB
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
      
      {files.length > 0 && (
        <FileList files={files} onRemove={removeFile} />
      )}
    </div>
  );
}
```

---

### ✅ 步驟 1.4: 開發「案件列表與審核」功能 (Chair)

#### 案件詳情頁面
- [ ] **建立動態路由案件頁面**

```tsx
// src/app/cases/[id]/page.tsx
export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const { data: case_, loading } = useCase(params.id);
  const { user } = useAuth();
  const { mutate: updateCase } = useUpdateCase();
  
  if (loading) return <CaseDetailSkeleton />;
  if (!case_) return <div>案件不存在</div>;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <CaseHeader case={case_} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CaseDetails case={case_} />
          <CaseAttachments attachments={case_.attachments} />
          <CaseActivity logs={case_.logs} />
        </div>
        
        <div className="space-y-6">
          <CaseStatus case={case_} />
          
          {user?.role === 'Chair' && (
            <ChairActions case={case_} onUpdate={updateCase} />
          )}
          
          {user?.role === 'Caseworker' && case_.assigned_caseworker?.id === user.id && (
            <CaseworkerActions case={case_} onUpdate={updateCase} />
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Chair 操作面板
- [ ] **實現 Chair 專用操作按鈕**

```tsx
// src/components/ChairActions.tsx
export function ChairActions({ case_, onUpdate }: ChairActionsProps) {
  const [assigneeId, setAssigneeId] = useState('');
  const { data: caseworkers } = useCaseworkers();
  
  const handleAssign = async () => {
    if (!assigneeId) return;
    
    await onUpdate({
      id: case_.id,
      status: 'Assigned',
      assigned_caseworker: assigneeId
    });
  };
  
  const handleReject = async () => {
    await onUpdate({
      id: case_.id,
      status: 'Rejected'
    });
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">主管操作</h3>
      
      {case_.status === 'New' || case_.status === 'Pending Review' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              指派給工作人員
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="form-select"
            >
              <option value="">請選擇工作人員</option>
              {caseworkers?.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleAssign}
              disabled={!assigneeId}
              className="btn-primary flex-1"
            >
              指派案件
            </button>
            <button
              onClick={handleReject}
              className="btn-danger flex-1"
            >
              退回案件
            </button>
          </div>
        </div>
      ) : case_.status === 'In Progress' ? (
        <div className="space-y-3">
          <button
            onClick={() => onUpdate({ id: case_.id, status: 'Completed' })}
            className="btn-success w-full"
          >
            批准完成
          </button>
          <button
            onClick={() => onUpdate({ id: case_.id, status: 'Rejected' })}
            className="btn-danger w-full"
          >
            拒絕並退回
          </button>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-4">
          目前狀態無可用操作
        </div>
      )}
    </div>
  );
}
```

---

## 🔌 API 整合

### Next.js API Routes
- [ ] **建立 API 代理層**

```typescript
// src/app/api/cases/route.ts
export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/cases`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    const cases = await response.json();
    return NextResponse.json(cases);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
```

### 資料查詢 Hooks
- [ ] **建立資料查詢自定義 Hooks**

```typescript
// src/hooks/useCases.ts
export function useCases() {
  const { user } = useAuth();
  
  return useSWR(
    user ? '/api/cases' : null,
    fetcher,
    {
      refreshInterval: 30000, // 30秒自動重新整理
      revalidateOnFocus: true
    }
  );
}

export function useCreateCase() {
  const { mutate } = useSWRConfig();
  
  return useMutation({
    mutationFn: async (data: CaseFormData) => {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create case');
      return response.json();
    },
    onSuccess: () => {
      mutate('/api/cases'); // 重新整理案件列表
    }
  });
}
```

---

## 🎨 UI/UX 設計

### 響應式設計
- [ ] **確保所有元件支援行動裝置**
- [ ] **實現觸控友善的互動設計**
- [ ] **優化載入狀態與錯誤處理**

### 狀態管理
- [ ] **載入狀態 (Loading States)**
- [ ] **錯誤處理 (Error Handling)**
- [ ] **成功提示 (Success Messages)**

---

## 🔍 驗收標準

### 功能測試
- [ ] Clerk 可以成功建立新案件
- [ ] 檔案上傳功能正常運作
- [ ] Chair 可以查看所有案件
- [ ] Chair 可以指派案件給 Caseworker
- [ ] Chair 可以退回案件
- [ ] 案件狀態正確更新
- [ ] 響應式設計在各種裝置上正常顯示

### 效能測試
- [ ] 頁面載入時間 < 3 秒
- [ ] 檔案上傳進度回饋
- [ ] 大量案件列表載入正常

### 安全性測試
- [ ] 檔案上傳安全檢查
- [ ] 角色權限正確控制
- [ ] 輸入資料驗證

---

## 📝 交付產出

1. **前端應用程式**
   - 響應式 Next.js 應用
   - Clerk 和 Chair 功能界面
   - 檔案上傳系統

2. **API 整合**
   - Next.js API Routes
   - 資料查詢 Hooks
   - 錯誤處理機制

3. **UI 元件庫**
   - 可重用的 React 元件
   - 響應式設計樣式
   - 表單驗證元件

---

## ⚠️ 注意事項

### 使用者體驗
- 確保載入狀態清楚明確
- 錯誤訊息友善且具體
- 操作回饋即時且明確

### 效能優化
- 實現虛擬列表 (如案件數量過多)
- 圖片懶載入
- API 請求去重與快取

### 可存取性
- 支援鍵盤導航
- 適當的 ARIA 標籤
- 顏色對比度符合標準

---

**上一階段**: [階段 0: 基礎建設](./phase_0_foundation.md)
**下一階段**: [階段 2: 後端 API 工作流程](./phase_2_backend_api.md)
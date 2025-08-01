'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, Save, AlertCircle, FileText, User, Clock, Flag } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { CasePriority, CreateCaseFormData, CASE_PRIORITY_CONFIG } from '@/types/case'
import { FileUpload } from './FileUpload'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// 表单验证模式
const caseFormSchema = z.object({
  title: z
    .string()
    .min(1, '请输入案件标题')
    .max(200, '标题长度不能超过200字符'),
  description: z
    .string()
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .optional()
    .default('MEDIUM'),
  assigned_to_id: z
    .string()
    .optional(),
  due_date: z
    .date()
    .optional(),
  metadata: z
    .record(z.any())
    .optional(),
})

type CaseFormValues = z.infer<typeof caseFormSchema>

interface CaseFormProps {
  onSubmit: (data: CreateCaseFormData) => Promise<void>
  isSubmitting?: boolean
  initialData?: Partial<CreateCaseFormData>
  mode?: 'create' | 'edit'
  className?: string
}

// 可指派用户类型
interface AvailableCaseworker {
  user_id: number
  username: string
  email: string
  activeCases: number
  canAcceptMore: boolean
}

export function CaseForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = 'create',
  className
}: CaseFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [availableCaseworkers, setAvailableCaseworkers] = useState<AvailableCaseworker[]>([])
  const [loadingCaseworkers, setLoadingCaseworkers] = useState(false)
  const { hasRole } = useAuthStore()

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'MEDIUM',
      assigned_to_id: initialData?.assigned_to_id || undefined,
      due_date: initialData?.due_date ? new Date(initialData.due_date) : undefined,
      metadata: initialData?.metadata || {},
    },
  })

  // 获取可指派的 Caseworker 列表
  useEffect(() => {
    const fetchAvailableCaseworkers = async () => {
      // 只有 MANAGER 和 ADMIN 才能看到可指派的用户列表
      if (!hasRole(['MANAGER', 'ADMIN'])) {
        return
      }

      setLoadingCaseworkers(true)
      try {
        const response = await apiClient.cases.getAvailableCaseworkers()
        setAvailableCaseworkers(response.data)
      } catch (error) {
        console.error('Failed to fetch available caseworkers:', error)
        // 如果 API 失败，使用空数组，不显示错误
        setAvailableCaseworkers([])
      } finally {
        setLoadingCaseworkers(false)
      }
    }

    fetchAvailableCaseworkers()
  }, [hasRole])

  // Debug wrapper for file uploads
  const handleFilesUploaded = (files: any[]) => {
    console.log('🔍 [CaseForm] DEBUG: FileUpload onFilesUploaded callback triggered')
    console.log('🔍 [CaseForm] DEBUG: Received files:', files)
    console.log('🔍 [CaseForm] DEBUG: Files length:', files.length)
    files.forEach((file, index) => {
      console.log(`🔍 [CaseForm] DEBUG: Received file ${index + 1}:`, file)
    })
    setUploadedFiles(files)
    console.log('🔍 [CaseForm] DEBUG: setUploadedFiles called with:', files)
  }

  const handleSubmit = async (values: CaseFormValues) => {
    setSubmitError(null)
    
    try {
      // DEBUG: Log original form values
      console.log('🔍 [CaseForm] Original form values:', values)
      console.log('🔍 [CaseForm] values.assigned_to_id:', values.assigned_to_id, 'type:', typeof values.assigned_to_id)
      
      // 處理 assigned_to_id：轉換為數字或 undefined
      let assignedToId: number | undefined = undefined
      if (values.assigned_to_id && values.assigned_to_id !== 'unassigned') {
        assignedToId = parseInt(values.assigned_to_id, 10)
        console.log('🔍 [CaseForm] Parsed assignedToId:', assignedToId, 'type:', typeof assignedToId)
      } else {
        console.log('🔍 [CaseForm] No assignment or unassigned selected')
      }

      const submitData: CreateCaseFormData = {
        ...values,
        assigned_to_id: assignedToId,
        due_date: values.due_date?.toISOString(),
        metadata: {
          ...values.metadata,
          attachments: uploadedFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            url: file.url,
            size: file.size,
            mimetype: file.mimetype,
          }))
        }
      }

      // Debug: Log detailed file and metadata information
      console.log('🔍 [CaseForm] DEBUG: Building submitData with files')
      console.log('🔍 [CaseForm] DEBUG: uploadedFiles state:', uploadedFiles)
      console.log('🔍 [CaseForm] DEBUG: uploadedFiles length:', uploadedFiles.length)
      uploadedFiles.forEach((file, index) => {
        console.log(`🔍 [CaseForm] DEBUG: uploadedFile ${index + 1}:`, file)
        console.log(`🔍 [CaseForm] DEBUG: - filename: ${file.filename}`)
        console.log(`🔍 [CaseForm] DEBUG: - originalname: ${file.originalname}`)
        console.log(`🔍 [CaseForm] DEBUG: - url: ${file.url}`)
        console.log(`🔍 [CaseForm] DEBUG: - size: ${file.size}`)
        console.log(`🔍 [CaseForm] DEBUG: - mimetype: ${file.mimetype}`)
      })
      console.log('🔍 [CaseForm] DEBUG: submitData.metadata:', submitData.metadata)
      console.log('🔍 [CaseForm] DEBUG: submitData.metadata.attachments:', submitData.metadata.attachments)

      console.log('🔍 [CaseForm] submitData:', submitData)
      console.log('🔍 [CaseForm] submitData.assigned_to_id:', submitData.assigned_to_id)

      // Convert assigned_to_id to assigned_to for backend compatibility
      const backendData = {
        ...submitData,
        assigned_to: submitData.assigned_to_id,
        assigned_to_id: undefined  // Remove the frontend field
      }

      console.log('🔍 [CaseForm] DEBUG: Final backendData conversion')
      console.log('🔍 [CaseForm] DEBUG: backendData.metadata:', backendData.metadata)
      console.log('🔍 [CaseForm] DEBUG: backendData.metadata.attachments:', backendData.metadata.attachments)
      if (backendData.metadata?.attachments) {
        console.log('🔍 [CaseForm] DEBUG: backendData has', backendData.metadata.attachments.length, 'attachments')
        backendData.metadata.attachments.forEach((attachment, index) => {
          console.log(`🔍 [CaseForm] DEBUG: backendData attachment ${index + 1}:`, attachment)
        })
      } else {
        console.log('🔍 [CaseForm] DEBUG: backendData has no attachments or metadata')
      }

      console.log('🔍 [CaseForm] Final backendData being sent:', backendData)
      console.log('🔍 [CaseForm] backendData.assigned_to:', backendData.assigned_to, 'type:', typeof backendData.assigned_to)

      await onSubmit(backendData)
      
      if (mode === 'create') {
        form.reset()
        setUploadedFiles([])
        toast.success('案件创建成功！')
      } else {
        toast.success('案件更新成功！')
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `案件${mode === 'create' ? '创建' : '更新'}失败`
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const clearError = () => {
    setSubmitError(null)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{mode === 'create' ? '创建新案件' : '编辑案件'}</span>
          </CardTitle>
          <CardDescription>
            填写下面的信息来{mode === 'create' ? '创建' : '更新'}案件。标题为必填项。
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 错误提示 */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    {submitError}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="h-auto p-0 text-xs"
                    >
                      关闭
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">基本信息</h3>
                </div>

                {/* 案件标题 */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">案件标题</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="请输入案件标题"
                          disabled={isSubmitting}
                          className="text-base"
                        />
                      </FormControl>
                      <FormDescription>
                        简洁明了地描述案件的主要问题
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 案件描述 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>详细描述</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="请详细描述案件的具体情况、背景信息等..."
                          disabled={isSubmitting}
                          rows={4}
                          className="text-base resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        提供案件的详细信息，有助于更好地处理问题
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 案件设置 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">案件设置</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 优先级 */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优先级</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择优先级" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CASE_PRIORITY_CONFIG).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={config.variant} 
                                    className="w-fit text-xs"
                                  >
                                    {config.label}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          根据案件的紧急程度选择适当的优先级
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 指派给 */}
                  <FormField
                    control={form.control}
                    name="assigned_to_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>指派给</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting || loadingCaseworkers}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingCaseworkers ? "加载中..." : "选择处理人员"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">不指派</SelectItem>
                            {availableCaseworkers.map((caseworker) => (
                              <SelectItem key={caseworker.user_id} value={caseworker.user_id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3" />
                                  <span>{caseworker.username}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({caseworker.email})
                                  </span>
                                  {!caseworker.canAcceptMore && (
                                    <Badge variant="secondary" className="text-xs">满载</Badge>
                                  )}
                                  {caseworker.activeCases > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {caseworker.activeCases}个案件
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          选择负责处理这个案件的人员
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 截止日期 */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>截止日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-[280px] justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              disabled={isSubmitting}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP', { locale: zhCN })
                              ) : (
                                <span>选择截止日期</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        设置案件需要完成的截止日期（可选）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* 文件附件 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">文件附件</h3>
                </div>

                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  maxFiles={10}
                  className="w-full"
                />

                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    已上传 {uploadedFiles.length} 个文件
                  </div>
                )}
              </div>

              <Separator />

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => form.reset()}
                >
                  重置
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {mode === 'create' ? '创建中...' : '更新中...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {mode === 'create' ? '创建案件' : '更新案件'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

// 添加必填字段的CSS样式
const styles = `
.required::after {
  content: " *";
  color: rgb(239 68 68);
}
`

// 如果需要的话，可以添加全局样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
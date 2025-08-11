'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Save, AlertCircle, Edit3, X, Clock, FileText, Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Case, CASE_PRIORITY_CONFIG } from '@/types/case'
import { FileUpload } from './FileUpload'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// 表单验证模式 - 专门用于案件修改
const caseEditFormSchema = z.object({
  title: z
    .string()
    .min(1, '请输入案件标题')
    .max(200, '标题长度不能超过200字符'),
  description: z
    .string()
    .optional(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  due_date: z
    .date()
    .optional(),
  metadata: z
    .record(z.string(), z.any())
    .optional(),
})

type CaseEditFormValues = z.infer<typeof caseEditFormSchema>

interface CaseDetailEditProps {
  caseData: Case
  onCaseUpdate: (updatedCase: Case) => void
  className?: string
}

export function CaseDetailEdit({
  caseData,
  onCaseUpdate,
  className
}: CaseDetailEditProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const { user, hasRole } = useAuthStore()

  // 初始化表单 - 暂时禁用Zod验证来调试
  let form: any
  try {
    form = useForm<CaseEditFormValues>({
      // resolver: zodResolver(caseEditFormSchema), // 暂时注释掉
      defaultValues: {
        title: caseData?.title || '',
        description: caseData?.description || '',
        priority: (caseData?.priority as any) || 'MEDIUM',
        due_date: caseData?.due_date ? new Date(caseData.due_date) : undefined,
        metadata: caseData?.metadata || {},
      },
      mode: 'onSubmit',
    })
  } catch (error) {
    console.error('🔍 [CaseDetailEdit] Error initializing form:', error)
    return null
  }

  // 检查当前用户是否可以修改案件
  const canEditCase = () => {
    // 只有 ADMIN 或 MANAGER 可以修改案件详情
    const hasPermission = hasRole(['ADMIN', 'MANAGER'])
    // 只能在案件被用户接受前修改（OPEN 或 PENDING 状态）
    const isEditableStatus = ['OPEN', 'PENDING'].includes(caseData.status)
    
    console.log('🔍 [CaseDetailEdit] Checking edit permissions:', {
      userRole: user?.role,
      hasPermission,
      caseStatus: caseData.status,
      isEditableStatus,
      canEdit: hasPermission && isEditableStatus
    })
    
    return hasPermission && isEditableStatus
  }

  // 重置表单数据当案件数据变更时
  useEffect(() => {
    if (caseData) {
      form.reset({
        title: caseData.title || '',
        description: caseData.description || '',
        priority: caseData.priority || 'MEDIUM',
        due_date: caseData.due_date ? new Date(caseData.due_date) : null,
        metadata: caseData.metadata || {},
      })

      // 如果案件有附件，设置到 uploadedFiles 中
      if (caseData.metadata?.attachments && Array.isArray(caseData.metadata.attachments)) {
        setUploadedFiles(caseData.metadata.attachments)
      } else {
        setUploadedFiles([])
      }
    }
  }, [caseData, form])

  // 处理文件上传
  const handleFilesUploaded = (files: any[]) => {
    console.log('🔍 [CaseDetailEdit] Files uploaded:', files)
    setUploadedFiles(files)
  }

  // 处理表单提交
  const handleSubmit = async (values: CaseEditFormValues) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      console.log('🔍 [CaseDetailEdit] Submitting case edit:', values)

      // 基本验证
      if (!values.title || values.title.trim().length === 0) {
        setSubmitError('请输入案件标题')
        setIsSubmitting(false)
        return
      }
      
      if (values.title.trim().length > 200) {
        setSubmitError('标题长度不能超过200字符')
        setIsSubmitting(false)
        return
      }

      // 构建更新数据
      const updateData = {
        title: values.title.trim(),
        description: values.description || '',
        priority: values.priority || 'MEDIUM',
        due_date: values.due_date?.toISOString(),
        metadata: {
          ...values.metadata,
          attachments: uploadedFiles.map(file => ({
            filename: file.filename,
            originalname: file.originalname || file.originalName,
            url: file.url,
            size: file.size,
            mimetype: file.mimetype,
          }))
        }
      }

      console.log('🔍 [CaseDetailEdit] Sending update data:', updateData)

      // 发送更新请求
      const response = await api.cases.update(caseData.id, updateData)
      console.log('🔍 [CaseDetailEdit] Update response:', response.data)

      // 更新本地案件数据 - 保持原有类型结构
      const updatedCase: Case = {
        ...caseData,
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority as any,
        due_date: updateData.due_date,
        metadata: updateData.metadata,
        updated_at: new Date().toISOString()
      }

      onCaseUpdate(updatedCase)
      setIsEditDialogOpen(false)
      toast.success('案件详情修改成功！')

    } catch (error: any) {
      console.error('🔍 [CaseDetailEdit] Update error:', error)
      const errorMessage = error.response?.data?.message || '修改案件详情失败'
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 清除错误
  const clearError = () => {
    setSubmitError(null)
  }

  // 安全检查：确保案件数据存在
  if (!caseData || !caseData.id) {
    return null
  }

  // 如果不能编辑案件，不显示组件
  if (!canEditCase()) {
    return null
  }

  return (
    <div className={className}>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Edit3 className="h-5 w-5 mr-2" />
            案件详情编辑
          </CardTitle>
          <CardDescription className="text-orange-700">
            在用户接受案件之前，您可以修改案件的详细信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 当前状态信息 */}
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>案件详情：</strong>{caseData.title}
              <br />
              <strong>当前状态：</strong>
              <Badge variant="outline" className="ml-1">
                {caseData.status === 'OPEN' ? '待指派' : 
                 caseData.status === 'PENDING' ? '待接受' : caseData.status}
              </Badge>
              <br />
              <strong>最后修改：</strong>
              {new Date(caseData.updated_at).toLocaleString('zh-CN')}
            </AlertDescription>
          </Alert>

          {/* 编辑按钮 */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline" disabled={isSubmitting}>
                <Edit3 className="h-4 w-4 mr-2" />
                编辑案件详情
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-orange-800">
                  <Edit3 className="h-5 w-5 mr-2" />
                  编辑案件详情
                </DialogTitle>
                <DialogDescription>
                  修改案件的详细信息。所有修改将被自动记录并发送通知给相关用户。
                </DialogDescription>
              </DialogHeader>

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
                              value={field.value}
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

                      {/* 截止日期 */}
                      <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>截止日期</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onDateChange={field.onChange}
                                placeholder="选择截止日期"
                                disabled={isSubmitting}
                                disablePastDates={true}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>
                              设置案件需要完成的截止日期（可选）
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                      initialFiles={uploadedFiles}
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

                  {/* 操作按钮 */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        form.reset()
                        setSubmitError(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px] bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存修改
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
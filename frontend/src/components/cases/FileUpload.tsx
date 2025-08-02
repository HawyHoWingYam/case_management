'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'  // 修复：使用正确的导入
import { toast } from 'sonner'

interface FileUploadProps {
  onFilesUploaded: (files: any[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedFileTypes?: Record<string, string[]>
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  result?: any
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  className
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      ).join('\n')
      setError(errors)
      return
    }

    // 检查文件数量限制
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      setError(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    // 开始上传文件
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // 逐个上传文件
    acceptedFiles.forEach(async (file, index) => {
      try {
        console.log('🔍 [FileUpload] Uploading file:', file.name)
        const response = await api.files.upload(file)  // 修复：使用api而不是apiClient
        console.log('🔍 [FileUpload] Upload response:', response.data)
        
        // 更新上传状态
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { ...uf, progress: 100, status: 'success', result: response.data }
              : uf
          )
        )

        // 添加到已上传文件列表
        setUploadedFiles(prev => {
          const newFiles = [...prev, response.data]
          // Use setTimeout to avoid setState during render
          setTimeout(() => onFilesUploaded(newFiles), 0)
          return newFiles
        })

        toast.success(`文件 ${file.name} 上传成功`)

      } catch (error: any) {
        console.error('🔍 [FileUpload] Upload error:', error)
        const errorMessage = error.response?.data?.message || '文件上传失败'
        
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { ...uf, status: 'error', error: errorMessage }
              : uf
          )
        )

        toast.error(`文件 ${file.name} 上传失败: ${errorMessage}`)
      }
    })
  }, [uploadedFiles.length, maxFiles, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedFileTypes,
  })

  const removeFile = (fileToRemove: any) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.filename !== fileToRemove.filename)
      // Use setTimeout to avoid setState during render
      setTimeout(() => onFilesUploaded(newFiles), 0)
      return newFiles
    })
  }

  const retryUpload = (uploadingFile: UploadingFile) => {
    onDrop([uploadingFile.file], [])
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-primary">释放文件到这里...</p>
        ) : (
          <div>
            <p className="mb-1">拖拽文件到这里，或点击选择文件</p>
            <p className="text-sm text-muted-foreground">
              支持图片、PDF、文档等格式，单个文件最大 {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
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

      {/* 上传中的文件 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              <File className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    {uploadingFile.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {uploadingFile.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {uploadingFile.status === 'uploading' && (
                  <Progress value={uploadingFile.progress} className="mt-1" />
                )}
                {uploadingFile.status === 'error' && uploadingFile.error && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-red-500">{uploadingFile.error}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => retryUpload(uploadingFile)}
                      className="h-auto p-0 text-xs text-red-500 hover:text-red-700"
                    >
                      重试
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已上传的文件 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">已上传的文件 ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/25">
              <File className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.originalname || file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(file.size / 1024)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file)}
                className="h-auto p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
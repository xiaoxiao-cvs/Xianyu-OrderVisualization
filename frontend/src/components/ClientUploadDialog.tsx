import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Progress, useToast } from '@/components/ui'
import { 
  clientApi, 
  calculateFileHash, 
  uploadToOSS,
  type OSSStatus 
} from '@/lib/api'
import { cn } from '@/lib/utils'

interface ClientUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accessKey: string
  onSuccess: () => void
}

interface UploadFile {
  file: File
  hash: string
  status: 'pending' | 'hashing' | 'checking' | 'uploading' | 'success' | 'error' | 'exists'
  progress: number
  error?: string
}

export default function ClientUploadDialog({ 
  open, 
  onOpenChange, 
  accessKey, 
  onSuccess 
}: ClientUploadDialogProps) {
  const { addToast } = useToast()
  const [ossStatus, setOssStatus] = React.useState<OSSStatus | null>(null)
  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 获取 OSS 状态
  React.useEffect(() => {
    if (open && accessKey) {
      clientApi.getOSSStatus(accessKey)
        .then(res => setOssStatus(res.data))
        .catch(() => setOssStatus({ oss_enabled: false, max_file_size_mb: 300, max_files_per_order: 5 }))
    }
  }, [open, accessKey])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      hash: '',
      status: 'pending',
      progress: 0
    }))
    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 上传单个文件
  const uploadFile = async (uploadFile: UploadFile, index: number) => {
    const updateStatus = (updates: Partial<UploadFile>) => {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))
    }

    try {
      // 1. 计算 Hash
      updateStatus({ status: 'hashing', progress: 0 })
      const hash = await calculateFileHash(uploadFile.file)
      updateStatus({ hash, progress: 10 })

      // 2. 检查是否已存在
      updateStatus({ status: 'checking', progress: 20 })
      const checkResult = await clientApi.checkFileHash(accessKey, hash)
      
      if (checkResult.data.exists) {
        updateStatus({ status: 'exists', progress: 100 })
        return true
      }

      // 3. 上传文件
      updateStatus({ status: 'uploading', progress: 30 })
      
      if (ossStatus?.oss_enabled) {
        // OSS 直传模式
        const signatureRes = await clientApi.getOSSSignature(
          accessKey,
          hash,
          uploadFile.file.name,
          uploadFile.file.type || 'application/octet-stream'
        )
        
        const success = await uploadToOSS(
          signatureRes.data,
          uploadFile.file,
          hash,
          (percent) => updateStatus({ progress: 30 + percent * 0.7 })
        )
        
        if (!success) {
          throw new Error('OSS 上传失败')
        }
      } else {
        // 传统上传模式
        await clientApi.uploadFile(accessKey, uploadFile.file, (percent) => {
          updateStatus({ progress: 30 + percent * 0.7 })
        })
      }

      updateStatus({ status: 'success', progress: 100 })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败'
      updateStatus({ status: 'error', error: message })
      return false
    }
  }

  // 开始上传所有文件
  const handleUpload = async () => {
    setIsUploading(true)
    
    let successCount = 0
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        const success = await uploadFile(files[i], i)
        if (success) successCount++
      }
    }

    setIsUploading(false)
    
    if (successCount > 0) {
      addToast({ 
        title: '上传完成', 
        description: `成功上传 ${successCount} 个文件`,
        variant: 'success' 
      })
      onSuccess()
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false)
      setFiles([])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
      case 'exists':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'hashing':
      case 'checking':
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'hashing': return '计算哈希...'
      case 'checking': return '检查重复...'
      case 'uploading': return '上传中...'
      case 'success': return '上传成功'
      case 'exists': return '文件已存在'
      case 'error': return '上传失败'
      default: return '等待上传'
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* 对话框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative w-full max-w-lg p-6 rounded-3xl',
              'bg-card backdrop-blur-xl border border-border/50 shadow-2xl'
            )}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">上传需求文件</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {ossStatus?.oss_enabled ? '使用 OSS 直传，速度更快' : '文件将上传至服务器'}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  'hover:bg-muted/50 disabled:opacity-50'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 文件拖放区 */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer',
                'border-2 border-dashed transition-all duration-200',
                isUploading && 'pointer-events-none opacity-50',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">点击或拖拽上传文件</p>
              <p className="text-sm text-muted-foreground text-center">
                最多 {ossStatus?.max_files_per_order || 5} 个文件，单个最大 {ossStatus?.max_file_size_mb || 300}MB
              </p>
            </div>

            {/* 文件列表 */}
            {files.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                {files.map((uploadFile, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl',
                      'bg-muted/30 border border-border/30'
                    )}
                  >
                    {getStatusIcon(uploadFile.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadFile.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        <span>·</span>
                        <span>{getStatusText(uploadFile.status)}</span>
                      </div>
                      {(uploadFile.status === 'uploading' || uploadFile.status === 'hashing' || uploadFile.status === 'checking') && (
                        <Progress value={uploadFile.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    {uploadFile.status === 'pending' && !isUploading && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                        className="p-1 rounded-lg hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className={cn(
                  'flex-1 h-11 rounded-xl font-medium transition-all duration-200',
                  'bg-muted/50 text-foreground hover:bg-muted',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={pendingCount === 0 || isUploading}
                className={cn(
                  'flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    上传中...
                  </>
                ) : (
                  `上传 ${pendingCount} 个文件`
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

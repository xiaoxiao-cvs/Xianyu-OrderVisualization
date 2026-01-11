import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2, FileText } from 'lucide-react'
import { Progress, useToast } from '@/components/ui'
import { fileApi, type Order } from '@/lib/api'
import { cn } from '@/lib/utils'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onSuccess: () => void
  /** 上传文件类型：req=需求文件，source=源码文件 */
  fileType?: 'req' | 'source'
}

export default function UploadDialog({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess,
  fileType = 'source'  // 默认为源码文件（管理员发货）
}: UploadDialogProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)

    try {
      // 使用 access_key 上传
      await fileApi.upload(order.access_key, fileType, selectedFile, (percent) => {
        setProgress(percent)
      })
      addToast({ title: '发货成功', description: '文件已上传', variant: 'success' })
      onSuccess()
      setSelectedFile(null)
    } catch {
      addToast({ title: '上传失败', variant: 'error' })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false)
      setSelectedFile(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
              'relative w-full max-w-md p-6 rounded-3xl',
              'bg-card backdrop-blur-xl border border-border/50 shadow-2xl'
            )}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">发货</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  订单 #{order.id} · {order.client_name}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={uploading}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  'hover:bg-muted/50 disabled:opacity-50'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 文件选择区 */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer',
                'border-2 border-dashed transition-all duration-200',
                uploading && 'pointer-events-none opacity-50',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              
              {selectedFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-medium text-foreground mb-1">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">点击或拖拽上传文件</p>
                  <p className="text-sm text-muted-foreground text-center">
                    支持 ZIP, RAR, 7Z 等压缩包格式
                  </p>
                </>
              )}
            </div>

            {/* 上传进度 */}
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">上传中...</span>
                  <span className="text-foreground font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={uploading}
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
                disabled={!selectedFile || uploading}
                className={cn(
                  'flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '确认发货'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import * as React from 'react'
import { Upload } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  useToast,
} from '@/components/ui'
import { fileApi, type Order } from '@/lib/api'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onSuccess: () => void
}

export default function UploadDialog({ open, onOpenChange, order, onSuccess }: UploadDialogProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)

    try {
      await fileApi.upload(order.id, selectedFile, 'delivery', (percent) => {
        setProgress(percent)
      })
      addToast({ title: '发货成功', description: '文件已上传', variant: 'success' })
      onSuccess()
      setSelectedFile(null)
    } catch (error) {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发货 - 订单 #{order.id}</DialogTitle>
          <DialogDescription>
            上传交付文件给客户，支持 ZIP、RAR 等压缩包格式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 文件选择区 */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 hover:border-primary hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              {selectedFile ? (
                <p className="text-sm font-medium">{selectedFile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">点击或拖拽选择文件</p>
              )}
            </div>
          </div>

          {/* 上传进度 */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传中...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} loading={uploading}>
            确认发货
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

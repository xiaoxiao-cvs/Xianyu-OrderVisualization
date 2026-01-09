import * as React from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Download, Upload, Package, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  useToast,
} from '@/components/ui'
import { orderApi, fileApi, type Order, type FileItem } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function ClientOrderView() {
  const { hash } = useParams<{ hash: string }>()
  const { addToast } = useToast()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 加载订单数据
  React.useEffect(() => {
    if (!hash) return

    const loadData = async () => {
      try {
        const [orderRes, filesRes] = await Promise.all([
          orderApi.getByHash(hash),
          orderApi.getFilesByHash(hash),
        ])
        setOrder(orderRes.data)
        setFiles(filesRes.data)
      } catch (err) {
        setError('订单不存在或链接已失效')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hash])

  // 文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !order) return

    // 前端校验文件类型
    const allowedExtensions = ['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      addToast({ 
        title: '文件类型不支持', 
        description: `仅支持: ${allowedExtensions.join(', ')}`,
        variant: 'error' 
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      await fileApi.upload(order.id, file, 'requirement', (percent) => {
        setUploadProgress(percent)
      })
      addToast({ title: '文件上传成功', variant: 'success' })
      // 刷新文件列表
      const filesRes = await orderApi.getFilesByHash(hash!)
      setFiles(filesRes.data)
    } catch (err) {
      addToast({ title: '上传失败', variant: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 下载文件
  const handleDownload = (file: FileItem) => {
    fileApi.download(file.id)
    addToast({ title: '开始下载...', variant: 'info' })
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-10">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">访问失败</h2>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const requirementFiles = files.filter((f) => f.fileType === 'requirement')
  const deliveryFiles = files.filter((f) => f.fileType === 'delivery')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">项目交付中心</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            订单号: {order.hash.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl p-4 space-y-6">
        {/* 状态卡片 */}
        <Card className={cn(
          'border-2',
          order.status === 'delivered' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
        )}>
          <CardContent className="flex items-center gap-4 py-6">
            {order.status === 'delivered' ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-green-800">项目已交付 🎉</h2>
                  <p className="text-green-700">请在下方下载您的交付文件</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-10 w-10 text-yellow-600" />
                <div>
                  <h2 className="text-xl font-bold text-yellow-800">项目开发中</h2>
                  <p className="text-yellow-700">请耐心等待，我们会尽快完成</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 订单信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">订单信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">备注</span>
              <span>{order.customerNote}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>{format(new Date(order.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">状态</span>
              <Badge variant={order.status === 'delivered' ? 'success' : 'warning'}>
                {order.status === 'delivered' ? '已交付' : '进行中'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 交付文件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4" />
              交付源码
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryFiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">暂无交付文件</p>
            ) : (
              <div className="space-y-2">
                {deliveryFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} · {format(new Date(file.uploadedAt), 'MM-dd HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleDownload(file)}>
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 需求文件 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              需求文件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirementFiles.length > 0 && (
              <div className="space-y-2">
                {requirementFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} · {format(new Date(file.uploadedAt), 'MM-dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 上传区域 */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 hover:border-primary hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">点击或拖拽上传补充资料</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 ZIP, RAR, PDF, DOC, 图片等格式
                </p>
              </div>
            </div>

            {/* 上传进度 */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>上传中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          如有问题请联系客服 · 订单管理系统
        </div>
      </footer>
    </div>
  )
}

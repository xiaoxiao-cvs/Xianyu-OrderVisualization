import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  ArrowLeft,
  Moon,
  Sun,
  Clock,
  Package,
  Loader2,
  CheckCircle2,
  Edit3,
  Truck,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress, useToast } from '@/components/ui'
import { orderApi, fileApi, type Order, type FileItem } from '@/lib/api'
import { cn } from '@/lib/utils'

// 状态 Tag 组件
function StatusTag({ status }: { status: Order['status'] }) {
  const config: Record<Order['status'], { label: string; icon: typeof Edit3; className: string }> = {
    draft: { label: '草稿', icon: Edit3, className: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300' },
    collecting: { label: '需求收集中', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    collected: { label: '需求已收集', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    quoted: { label: '已报价', icon: Clock, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    confirmed: { label: '已确认', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    repo_created: { label: '仓库已创建', icon: Package, className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
    coding: { label: '编码中', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    testing: { label: '测试中', icon: Clock, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    code_review: { label: '待审核', icon: Clock, className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
    revision: { label: '修改中', icon: Edit3, className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300' },
    ready: { label: '待发货', icon: Truck, className: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300' },
    delivered: { label: '已发货', icon: Truck, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    accepted: { label: '客户已确认', icon: CheckCircle2, className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    disputed: { label: '争议中', icon: AlertCircle, className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    cancelled: { label: '已取消', icon: AlertCircle, className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300' },
    expired: { label: '已过期', icon: AlertCircle, className: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300' },
  }

  const { label, icon: Icon, className } = config[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

// 文件卡片组件
function FileCard({
  file,
  onDownload,
}: {
  file: FileItem
  onDownload: (file: FileItem) => void
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl',
        'bg-muted/30 backdrop-blur-sm border border-border/50',
        'hover:bg-muted/50 transition-all duration-200'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{file.filename_original}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
        </div>
      </div>
      <button
        onClick={() => onDownload(file)}
        className={cn(
          'p-2.5 rounded-xl transition-all duration-200',
          'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
          'active:scale-95'
        )}
      >
        <Download className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// 文件上传区域组件
function FileUploadArea({
  onUpload,
  uploading,
  progress,
}: {
  onUpload: (file: File) => void
  uploading: boolean
  progress: number
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer',
        'border-2 border-dashed transition-all duration-200',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
        accept=".zip,.rar,.7z,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
      
      {uploading ? (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">上传中 {progress}%</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="font-medium text-foreground mb-1">点击或拖拽上传文件</p>
          <p className="text-sm text-muted-foreground text-center">
            支持 ZIP, RAR, 7Z, PDF, DOC, TXT, PNG, JPG
          </p>
        </>
      )}
    </div>
  )
}

export default function OrderView() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  
  const [order, setOrder] = React.useState<Order | null>(null)
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)

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
        setFiles(filesRes.data.files)
      } catch {
        setError('订单不存在或链接已失效')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hash])

  // 文件上传
  const handleFileUpload = async (file: File) => {
    if (!order) return

    const allowedExtensions = ['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      addToast({
        title: '文件类型不支持',
        description: `仅支持: ${allowedExtensions.join(', ')}`,
        variant: 'error',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      await fileApi.upload(order.access_key, 'req', file, (percent) => {
        setUploadProgress(percent)
      })
      addToast({ title: '文件上传成功', variant: 'success' })
      const filesRes = await orderApi.getFilesByHash(hash!)
      setFiles(filesRes.data.files)
    } catch {
      addToast({ title: '上传失败', variant: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // 下载文件
  const handleDownload = (file: FileItem) => {
    fileApi.download(file.id)
    addToast({ title: '开始下载...', variant: 'info' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'w-full max-w-md p-8 rounded-3xl text-center',
            'bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg'
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">访问失败</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className={cn(
              'px-6 py-3 rounded-xl font-medium transition-all duration-200',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'active:scale-95'
            )}
          >
            返回首页
          </button>
        </motion.div>
      </div>
    )
  }

  const requirementFiles = files.filter((f) => f.file_type === 'req')
  const deliveryFiles = files.filter((f) => f.file_type === 'delivery' || f.file_type === 'source')

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <button
            onClick={() => navigate('/')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
              'hover:bg-muted/50 active:scale-95'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">返回</span>
          </button>

          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              #{order.access_key.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200',
              'hover:bg-muted/50 active:scale-95'
            )}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：订单信息 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-2/5 space-y-6"
          >
            {/* 标题和状态 */}
            <div
              className={cn(
                'p-6 rounded-3xl',
                'bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">
                  {order.client_name || '订单详情'}
                </h1>
                <StatusTag status={order.status} />
              </div>

              {order.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">备注</h3>
                  <p className="text-foreground">{order.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  下单时间：{format(new Date(order.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </span>
              </div>
            </div>

            {/* 项目简介 */}
            <div
              className={cn(
                'p-6 rounded-3xl',
                'bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm'
              )}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">项目简介与要求</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-foreground">
                    本项目为定制开发项目，所有源代码归客户所有
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-foreground">
                    交付文件包含完整源码及使用说明
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-foreground">
                    如有问题请及时联系卖家
                  </p>
                </div>
              </div>

              {/* 技术栈标签 */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">技术栈</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Tailwind CSS', 'Vite'].map((tech) => (
                    <span
                      key={tech}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium',
                        'bg-muted/50 text-foreground'
                      )}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 右侧：文件管理 Tabs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-3/5"
          >
            <div
              className={cn(
                'p-6 rounded-3xl',
                'bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm'
              )}
            >
              <Tabs defaultValue="upload">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="w-4 h-4" />
                    上传需求
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="gap-2">
                    <Download className="w-4 h-4" />
                    交付文件
                    {deliveryFiles.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                        {deliveryFiles.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* 上传需求 Tab */}
                <TabsContent value="upload">
                  <div className="space-y-4">
                    <FileUploadArea
                      onUpload={handleFileUpload}
                      uploading={uploading}
                      progress={uploadProgress}
                    />

                    {requirementFiles.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          已上传文件 ({requirementFiles.length})
                        </h3>
                        {requirementFiles.map((file) => (
                          <FileCard key={file.id} file={file} onDownload={handleDownload} />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 交付文件 Tab */}
                <TabsContent value="delivery">
                  {order.status === 'delivered' && deliveryFiles.length > 0 ? (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-2xl',
                          'bg-green-100/50 dark:bg-green-900/20'
                        )}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            项目已交付 🎉
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            请下载以下文件
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {deliveryFiles.map((file) => (
                          <FileCard key={file.id} file={file} onDownload={handleDownload} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">暂无交付文件</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        项目完成后，卖家将在此处上传交付文件
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

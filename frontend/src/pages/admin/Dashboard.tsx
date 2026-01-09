import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Copy,
  LogOut,
  FileText,
  Truck,
  Trash2,
  Moon,
  Sun,
  Home,
  Package,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui'
import { orderApi, type Order, type OrderLog } from '@/lib/api'
import UploadDialog from '@/components/UploadDialog'
import EvidenceViewer from '@/components/EvidenceViewer'
import { cn } from '@/lib/utils'

// 状态徽章组件
function StatusBadge({ status }: { status: Order['status'] }) {
  const config = {
    pending: {
      label: '🔴 待上传',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    processing: {
      label: '🟡 处理中',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    delivered: {
      label: '🟢 已发货',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
  }

  const { label, className } = config[status] || config.pending

  return (
    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium', className)}>
      {label}
    </span>
  )
}

// 订单卡片组件
function OrderCard({
  order,
  onCopyLink,
  onShip,
  onViewLogs,
  onDelete,
}: {
  order: Order
  onCopyLink: () => void
  onShip: () => void
  onViewLogs: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'p-5 rounded-2xl transition-all duration-200',
        'bg-card/80 backdrop-blur-xl border border-border/50',
        'hover:shadow-lg hover:border-primary/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">#{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <h3 className="font-semibold text-foreground text-lg">{order.client_name}</h3>
        </div>
        <button
          onClick={onCopyLink}
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            'hover:bg-muted/50 active:scale-95'
          )}
          title="复制链接"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {format(new Date(order.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={onShip}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl',
            'bg-primary/10 text-primary font-medium text-sm',
            'hover:bg-primary hover:text-primary-foreground transition-all duration-200',
            'active:scale-95'
          )}
        >
          <Truck className="w-4 h-4" />
          发货
        </button>
        <button
          onClick={onViewLogs}
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            'hover:bg-muted/50 active:scale-95'
          )}
          title="查看日志"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={onDelete}
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            'hover:bg-destructive/10 active:scale-95'
          )}
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </motion.div>
  )
}

// 新建订单对话框
function CreateOrderDialog({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (note: string) => void
  loading: boolean
}) {
  const [note, setNote] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (note.trim()) {
      onSubmit(note.trim())
      setNote('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">新建订单</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              客户备注
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：张三 - Python 自动化脚本"
              className={cn(
                'w-full h-12 px-4 rounded-xl',
                'bg-muted/30 border border-border/50',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                'transition-all duration-200'
              )}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              系统将自动生成唯一链接
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 h-11 rounded-xl font-medium',
                'bg-muted/50 text-foreground',
                'hover:bg-muted transition-all duration-200'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className={cn(
                'flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '创建'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [evidenceViewerOpen, setEvidenceViewerOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [logs, setLogs] = React.useState<OrderLog[]>([])
  const [creating, setCreating] = React.useState(false)

  // 加载订单列表
  const loadOrders = React.useCallback(async () => {
    try {
      const response = await orderApi.list()
      setOrders(response.data.items)
    } catch {
      addToast({ title: '加载订单失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 创建订单
  const handleCreateOrder = async (note: string) => {
    setCreating(true)
    try {
      await orderApi.create({ client_name: note })
      addToast({ title: '订单创建成功', variant: 'success' })
      setCreateDialogOpen(false)
      loadOrders()
    } catch {
      addToast({ title: '创建订单失败', variant: 'error' })
    } finally {
      setCreating(false)
    }
  }

  // 复制链接
  const copyLink = (accessKey: string) => {
    const url = `${window.location.origin}/order/${accessKey}`
    navigator.clipboard.writeText(url)
    addToast({ title: '链接已复制', variant: 'success' })
  }

  // 查看日志
  const handleViewLogs = async (order: Order) => {
    setSelectedOrder(order)
    try {
      const response = await orderApi.getLogs(order.id)
      setLogs(response.data)
      setEvidenceViewerOpen(true)
    } catch {
      addToast({ title: '加载日志失败', variant: 'error' })
    }
  }

  // 发货
  const handleShip = (order: Order) => {
    setSelectedOrder(order)
    setUploadDialogOpen(true)
  }

  // 删除订单
  const handleDelete = async (order: Order) => {
    if (!confirm(`确定要删除订单 #${order.id} 吗？`)) return
    try {
      await orderApi.delete(order.id)
      addToast({ title: '订单已删除', variant: 'success' })
      loadOrders()
    } catch {
      addToast({ title: '删除订单失败', variant: 'error' })
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // 过滤订单
  const filteredOrders = React.useMemo(() => {
    if (!searchQuery.trim()) return orders
    const query = searchQuery.toLowerCase()
    return orders.filter(
      (order) =>
        order.client_name.toLowerCase().includes(query) ||
        order.id.toString().includes(query)
    )
  }, [orders, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">订单管理后台</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                'hover:bg-muted/50 active:scale-95'
              )}
              title="返回首页"
            >
              <Home className="w-5 h-5" />
            </button>
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
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
                'hover:bg-destructive/10 text-destructive active:scale-95'
              )}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">退出</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto p-4 lg:p-6">
        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单..."
              className={cn(
                'w-full h-11 pl-10 pr-4 rounded-xl',
                'bg-muted/30 border border-border/50',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                'transition-all duration-200'
              )}
            />
          </div>

          {/* 新建按钮 */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className={cn(
              'flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-all duration-200',
              'active:scale-95'
            )}
          >
            <Plus className="w-5 h-5" />
            新建订单
          </button>
        </div>

        {/* 订单列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex flex-col items-center justify-center py-20 rounded-3xl',
              'bg-card/50 backdrop-blur-xl border border-border/50'
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? '未找到匹配的订单' : '暂无订单'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery ? '尝试其他关键词' : '点击上方"新建订单"按钮创建第一个订单'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCreateDialogOpen(true)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-all duration-200'
                )}
              >
                <Plus className="w-4 h-4" />
                新建订单
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCopyLink={() => copyLink(order.access_key)}
                  onShip={() => handleShip(order)}
                  onViewLogs={() => handleViewLogs(order)}
                  onDelete={() => handleDelete(order)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* 新建订单对话框 */}
      <AnimatePresence>
        {createDialogOpen && (
          <CreateOrderDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSubmit={handleCreateOrder}
            loading={creating}
          />
        )}
      </AnimatePresence>

      {/* 上传对话框 */}
      {selectedOrder && (
        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          order={selectedOrder}
          onSuccess={() => {
            loadOrders()
            setUploadDialogOpen(false)
          }}
        />
      )}

      {/* 证据查看器 */}
      {selectedOrder && (
        <EvidenceViewer
          open={evidenceViewerOpen}
          onOpenChange={setEvidenceViewerOpen}
          order={selectedOrder}
          logs={logs}
        />
      )}
    </div>
  )
}

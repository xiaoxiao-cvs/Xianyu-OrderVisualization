import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Copy, LogOut, FileText, Truck, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useToast,
} from '@/components/ui'
import { orderApi, type Order, type OrderLog } from '@/lib/api'
import UploadDialog from '@/components/UploadDialog'
import EvidenceViewer from '@/components/EvidenceViewer'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [evidenceViewerOpen, setEvidenceViewerOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [logs, setLogs] = React.useState<OrderLog[]>([])
  const [newOrderNote, setNewOrderNote] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  // 加载订单列表
  const loadOrders = React.useCallback(async () => {
    try {
      const response = await orderApi.list()
      setOrders(response.data.items)
    } catch (error) {
      addToast({ title: '加载订单失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 创建订单
  const handleCreateOrder = async () => {
    if (!newOrderNote.trim()) return
    setCreating(true)
    try {
      await orderApi.create({ client_name: newOrderNote })
      addToast({ title: '订单创建成功', variant: 'success' })
      setCreateDialogOpen(false)
      setNewOrderNote('')
      loadOrders()
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      addToast({ title: '删除订单失败', variant: 'error' })
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // 状态徽章
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">🔴 待上传</Badge>
      case 'processing':
        return <Badge variant="secondary">🟡 处理中</Badge>
      case 'delivered':
        return <Badge variant="success">🟢 已发货</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">📦 订单管理后台</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>订单列表</CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新建订单
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新建订单</DialogTitle>
                  <DialogDescription>
                    输入客户备注信息，系统将自动生成唯一链接
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="note">客户备注</Label>
                    <Input
                      id="note"
                      placeholder="例如：张三 - Python 自动化脚本"
                      value={newOrderNote}
                      onChange={(e) => setNewOrderNote(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateOrder} loading={creating}>
                    创建
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <p className="text-muted-foreground">暂无订单</p>
                <p className="text-sm text-muted-foreground">点击上方"新建订单"按钮创建第一个订单</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>客户备注</TableHead>
                    <TableHead className="w-24">状态</TableHead>
                    <TableHead className="w-40">创建时间</TableHead>
                    <TableHead className="w-24">链接</TableHead>
                    <TableHead className="w-48">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(order.access_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShip(order)}
                            title="发货"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLogs(order)}
                            title="查看日志"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order)}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

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

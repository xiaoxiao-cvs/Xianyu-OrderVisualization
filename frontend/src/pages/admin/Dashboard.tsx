import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronRight, LogOut, RefreshCcw } from 'lucide-react'

import { Button, Input, useToast } from '@/components/ui'
import { orderApi, type Order, type OrderStatus, type TimelineEvent } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'collecting', label: '需求收集中' },
  { value: 'collected', label: '需求已收集' },
  { value: 'quoted', label: '已报价' },
  { value: 'confirmed', label: '已确认' },
  { value: 'repo_created', label: '仓库已创建' },
  { value: 'coding', label: '编码中' },
  { value: 'testing', label: '测试中' },
  { value: 'code_review', label: '待审核' },
  { value: 'revision', label: '修改中' },
  { value: 'ready', label: '待发货' },
  { value: 'delivered', label: '已发货' },
  { value: 'accepted', label: '客户已确认' },
  { value: 'disputed', label: '争议中' },
  { value: 'cancelled', label: '已取消' },
  { value: 'expired', label: '已过期' },
]

function statusLabel(status: OrderStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [orders, setOrders] = React.useState<Order[]>([])
  const [selected, setSelected] = React.useState<Order | null>(null)
  const [timeline, setTimeline] = React.useState<TimelineEvent[]>([])
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | ''>('')
  const [pendingStatus, setPendingStatus] = React.useState<OrderStatus>('collecting')
  const [overrideStatus, setOverrideStatus] = React.useState<OrderStatus>('collecting')
  const [overrideReason, setOverrideReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status_filter = statusFilter
      const response = await orderApi.list(params)
      setOrders(response.data.items)
      if (selected) {
        const found = response.data.items.find((item) => item.id === selected.id)
        setSelected(found ?? null)
      }
    } catch {
      addToast({ title: '加载订单失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast, search, selected, statusFilter])

  const loadTimeline = React.useCallback(
    async (orderId: number) => {
      try {
        const response = await orderApi.getTimeline(orderId)
        setTimeline(response.data.items)
      } catch {
        setTimeline([])
      }
    },
    []
  )

  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const selectOrder = async (order: Order) => {
    setSelected(order)
    setPendingStatus(order.status)
    setOverrideStatus(order.status)
    await loadTimeline(order.id)
  }

  const handleCreateOrder = async () => {
    const name = window.prompt('输入客户名')
    if (!name) return

    try {
      await orderApi.create({
        client_name: name,
        status: 'draft',
        project_type: 'other',
        difficulty: 'medium',
        budget_range: 'standard',
        priority: 'normal',
        tags: [],
        custom_tags: [],
        requirements: {
          summary: '',
          features: [],
          references: [],
          tech_preferences: [],
          deliverables: [],
          deadline: null,
          notes: '',
        },
      })
      addToast({ title: '订单已创建', variant: 'success' })
      await loadOrders()
    } catch {
      addToast({ title: '创建失败', variant: 'error' })
    }
  }

  const handleNormalTransition = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const response = await orderApi.updateStatus(selected.id, pendingStatus, '管理员状态推进')
      setSelected(response.data)
      await loadTimeline(selected.id)
      await loadOrders()
      addToast({ title: '状态已更新', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '状态更新失败'
      addToast({ title: message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverride = async () => {
    if (!selected || !overrideReason.trim()) return
    setSubmitting(true)
    try {
      const response = await orderApi.overrideStatus(selected.id, overrideStatus, overrideReason)
      setSelected(response.data)
      setOverrideReason('')
      await loadTimeline(selected.id)
      await loadOrders()
      addToast({ title: '已强制跳转状态', variant: 'success' })
    } catch {
      addToast({ title: '强制跳转失败', variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="text-lg font-semibold">订单管理平台</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadOrders} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              刷新
            </Button>
            <Button onClick={handleCreateOrder}>新建订单</Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('token')
                navigate('/login')
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              placeholder="搜索客户名/描述/需求"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value || '') as OrderStatus | '')}
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">加载中...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无订单</div>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => selectOrder(order)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition',
                    selected?.id === order.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{order.client_name}</div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    #{order.id} · {statusLabel(order.status)} ·{' '}
                    {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
          {!selected ? (
            <div className="py-20 text-center text-muted-foreground">请选择订单查看详情</div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">
                  #{selected.id} {selected.client_name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  当前状态: {statusLabel(selected.status)} | 优先级: {selected.priority}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-border/50 p-3 text-sm">
                  <div className="font-medium">正常流转</div>
                  <select
                    className="mt-2 h-9 w-full rounded-md border border-input bg-background px-2"
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value as OrderStatus)}
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Button className="mt-2 w-full" disabled={submitting} onClick={handleNormalTransition}>
                    推进状态
                  </Button>
                </div>

                <div className="rounded-lg border border-border/50 p-3 text-sm">
                  <div className="font-medium">管理员强制跳转</div>
                  <select
                    className="mt-2 h-9 w-full rounded-md border border-input bg-background px-2"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="mt-2"
                    placeholder="填写强制跳转原因"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                  <Button
                    className="mt-2 w-full"
                    variant="destructive"
                    disabled={submitting || !overrideReason.trim()}
                    onClick={handleOverride}
                  >
                    强制跳转
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-3">
                <h3 className="mb-3 text-sm font-semibold">时间线</h3>
                <div className="space-y-2">
                  {timeline.length === 0 ? (
                    <div className="text-sm text-muted-foreground">暂无时间线事件</div>
                  ) : (
                    timeline.map((item) => (
                      <div key={item.id} className="rounded-md border border-border/40 bg-background/50 p-2 text-xs">
                        <div className="font-medium">
                          {item.event_type} · {item.actor}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                        </div>
                        <pre className="mt-1 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                          {JSON.stringify(item.event_data, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

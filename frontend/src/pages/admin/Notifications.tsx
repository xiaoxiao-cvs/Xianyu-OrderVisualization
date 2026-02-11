import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Bell, CheckCheck, ChevronLeft } from 'lucide-react'

import { Button, useToast } from '@/components/ui'
import { notificationApi, type NotificationItem } from '@/lib/api'

export default function AdminNotifications() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [unreadOnly, setUnreadOnly] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [items, setItems] = React.useState<NotificationItem[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await notificationApi.list({ unread_only: unreadOnly })
      setItems(response.data.items)
      setUnreadCount(response.data.unread)
    } catch {
      addToast({ title: '加载通知失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast, unreadOnly])

  React.useEffect(() => {
    load()
  }, [load])

  const markRead = async (item: NotificationItem) => {
    if (item.is_read) return
    try {
      await notificationApi.read(item.id)
      await load()
    } catch {
      addToast({ title: '标记已读失败', variant: 'error' })
    }
  }

  const markAllRead = async () => {
    try {
      await notificationApi.readAll()
      await load()
      addToast({ title: '已全部标记已读', variant: 'success' })
    } catch {
      addToast({ title: '操作失败', variant: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">通知中心</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">未读 {unreadCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              返回后台
            </Button>
            <Button variant="secondary" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              全部已读
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            仅看未读
          </label>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-muted-foreground">加载中...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-muted-foreground">暂无通知</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  markRead(item)
                  if (item.order_id) navigate('/admin')
                }}
                className={`w-full rounded-xl border p-3 text-left ${
                  item.is_read ? 'border-border/50 bg-card/50' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{item.title}</div>
                  <span className="text-xs text-muted-foreground">{item.channel}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{item.content}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

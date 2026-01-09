import * as React from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { X, Download, Clock, Globe, Monitor } from 'lucide-react'
import html2canvas from 'html2canvas'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Order, OrderLog } from '@/lib/api'

interface EvidenceViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  logs: OrderLog[]
}

export default function EvidenceViewer({ open, onOpenChange, order, logs }: EvidenceViewerProps) {
  const { addToast } = useToast()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [saving, setSaving] = React.useState(false)

  // 保存证据截图
  const handleSaveEvidence = async () => {
    if (!contentRef.current) return

    setSaving(true)
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      
      const link = document.createElement('a')
      link.download = `订单${order.id}_访问日志_${format(new Date(), 'yyyyMMdd_HHmmss')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      addToast({ title: '证据已保存', variant: 'success' })
    } catch (error) {
      addToast({ title: '保存失败', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Side Panel */}
      <div className="relative ml-auto h-full w-full max-w-lg bg-background shadow-xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">访问日志 - 订单 #{order.id}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveEvidence}
              loading={saving}
            >
              <Download className="mr-2 h-4 w-4" />
              保存证据
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-auto p-4">
          <div ref={contentRef} className="bg-white p-4 rounded-lg">
            {/* 订单信息头 */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-bold text-lg mb-2">📦 订单访问证据</h3>
              <p className="text-sm text-muted-foreground">
                订单 #{order.id} · {order.customerNote}
              </p>
              <p className="text-sm text-muted-foreground">
                生成时间: {format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </p>
            </div>

            {/* 时间轴 */}
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无访问记录</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={cn(
                      'relative pl-6 pb-4',
                      index !== logs.length - 1 && 'border-l-2 border-muted'
                    )}
                  >
                    {/* 时间轴点 */}
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                    
                    {/* 日志内容 */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="font-medium mb-2">{log.action}</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          <span>IP: {log.ip}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Monitor className="h-3 w-3 mt-0.5" />
                          <span className="break-all">{log.userAgent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 页脚 */}
            <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
              此证据由订单管理系统自动生成，用于记录客户访问与下载行为
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

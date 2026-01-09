import * as React from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Clock, Globe, Monitor, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useToast } from '@/components/ui'
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
    } catch {
      addToast({ title: '保存失败', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'relative ml-auto h-full w-full max-w-lg',
              'bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-bold text-foreground">访问日志</h2>
                <p className="text-sm text-muted-foreground">订单 #{order.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEvidence}
                  disabled={saving}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                    'bg-primary/10 text-primary',
                    'hover:bg-primary hover:text-primary-foreground transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  保存证据
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-80px)] overflow-auto p-4">
              <div ref={contentRef} className="bg-white dark:bg-card p-6 rounded-2xl">
                {/* 订单信息头 */}
                <div className="mb-6 pb-4 border-b border-border/50">
                  <h3 className="font-bold text-lg text-foreground mb-2">📦 订单访问证据</h3>
                  <p className="text-sm text-muted-foreground">
                    订单 #{order.id} · {order.client_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    生成时间: {format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>

                {/* 时间轴 */}
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                      <Clock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground mb-1">暂无访问记录</p>
                    <p className="text-sm text-muted-foreground">客户访问后将自动记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'relative pl-6 pb-4',
                          index !== logs.length - 1 && 'border-l-2 border-border/50'
                        )}
                      >
                        {/* 时间轴点 */}
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        
                        {/* 日志内容 */}
                        <div className={cn(
                          'p-4 rounded-2xl',
                          'bg-muted/30 border border-border/50'
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                            </span>
                          </div>
                          <p className="font-medium text-foreground mb-3">{log.action}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="w-3.5 h-3.5" />
                              <span>IP: {log.ip}</span>
                            </div>
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Monitor className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span className="break-all text-xs">{log.userAgent}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 页脚 */}
                <div className="mt-6 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
                  此证据由订单管理系统自动生成，用于记录客户访问与下载行为
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

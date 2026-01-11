import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, FileText, CheckCircle2, AlertCircle, Package } from 'lucide-react'
import { Input, useToast } from '@/components/ui'
import { orderApi, type Order, type FileItem } from '@/lib/api'
import { cn } from '@/lib/utils'

interface OrderConvertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onSuccess: () => void
}

export default function OrderConvertDialog({ 
  open, 
  onOpenChange, 
  order, 
  onSuccess 
}: OrderConvertDialogProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [selectedFileIds, setSelectedFileIds] = React.useState<Set<number>>(new Set())
  const [xianyuOrderId, setXianyuOrderId] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [deleteUnselected, setDeleteUnselected] = React.useState(false)

  // 加载订单文件
  React.useEffect(() => {
    if (open && order) {
      loadFiles()
    }
  }, [open, order])

  const loadFiles = async () => {
    try {
      const res = await orderApi.getFilesByHash(order.access_key, true)
      setFiles(res.data.files)
      // 默认全选
      setSelectedFileIds(new Set(res.data.files.map(f => f.id)))
    } catch (error) {
      addToast({ title: '加载文件失败', variant: 'error' })
    }
  }

  const toggleFileSelection = (fileId: number) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const handleConvert = async () => {
    if (!xianyuOrderId.trim()) {
      addToast({ title: '请输入闲鱼订单号', variant: 'error' })
      return
    }

    if (xianyuOrderId.length < 10) {
      addToast({ title: '闲鱼订单号格式不正确', description: '订单号应至少10位', variant: 'error' })
      return
    }

    setLoading(true)

    try {
      await orderApi.convert({
        access_key: order.access_key,
        xianyu_order_id: xianyuOrderId.trim(),
        selected_file_ids: Array.from(selectedFileIds),
        delete_unselected: deleteUnselected,
        notes: notes.trim() || undefined
      })

      addToast({ 
        title: '订单转正成功', 
        description: `已绑定闲鱼订单号: ${xianyuOrderId}`,
        variant: 'success' 
      })
      onSuccess()
      handleClose()
    } catch (error) {
      addToast({ title: '转正失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      setXianyuOrderId('')
      setNotes('')
      setSelectedFileIds(new Set())
      setDeleteUnselected(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const selectedCount = selectedFileIds.size
  const unselectedCount = files.length - selectedCount

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
              'relative w-full max-w-lg p-6 rounded-3xl',
              'bg-card backdrop-blur-xl border border-border/50 shadow-2xl',
              'max-h-[90vh] overflow-hidden flex flex-col'
            )}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">转正订单</h2>
                  <p className="text-sm text-muted-foreground">
                    Hash: {order.access_key}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  'hover:bg-muted/50 disabled:opacity-50'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 闲鱼订单号输入 */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-foreground">
                闲鱼订单号 <span className="text-red-500">*</span>
              </label>
              <Input
                value={xianyuOrderId}
                onChange={(e) => setXianyuOrderId(e.target.value)}
                placeholder="请输入闲鱼订单号（如：1758888...）"
                disabled={loading}
                className="h-11"
              />
            </div>

            {/* 备注输入 */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-foreground">备注（可选）</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加订单备注..."
                disabled={loading}
                className="h-11"
              />
            </div>

            {/* 文件列表 */}
            <div className="space-y-2 mb-4 flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  选择保留的文件（{selectedCount}/{files.length}）
                </label>
                <button
                  onClick={() => {
                    if (selectedCount === files.length) {
                      setSelectedFileIds(new Set())
                    } else {
                      setSelectedFileIds(new Set(files.map(f => f.id)))
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedCount === files.length ? '取消全选' : '全选'}
                </button>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {files.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无文件
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                        'border border-border/30',
                        selectedFileIds.has(file.id)
                          ? 'bg-primary/10 border-primary/50'
                          : 'bg-muted/30 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                        selectedFileIds.has(file.id)
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      )}>
                        {selectedFileIds.has(file.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.filename_original}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} · {file.file_type === 'req' ? '需求文件' : '源码文件'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 删除选项 */}
            {unselectedCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteUnselected}
                    onChange={(e) => setDeleteUnselected(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      删除未选中的 {unselectedCount} 个文件
                    </p>
                    <p className="text-xs text-muted-foreground">
                      勾选后将永久删除，无法恢复
                    </p>
                  </div>
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                </label>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className={cn(
                  'flex-1 h-11 rounded-xl font-medium transition-all duration-200',
                  'bg-muted/50 text-foreground hover:bg-muted',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                取消
              </button>
              <button
                onClick={handleConvert}
                disabled={!xianyuOrderId.trim() || loading}
                className={cn(
                  'flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认转正'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

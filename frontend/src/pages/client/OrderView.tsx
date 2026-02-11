import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, CheckCircle2, Download, FileText, MessageSquare, UploadCloud } from 'lucide-react'

import { Button, Input, useToast } from '@/components/ui'
import { clientApi, fileApi, type FileItem, type Order, type TimelineEvent } from '@/lib/api'

function statusText(status: Order['status']) {
  const map: Record<Order['status'], string> = {
    draft: '草稿',
    collecting: '需求收集中',
    collected: '需求已收集',
    quoted: '已报价',
    confirmed: '已确认',
    repo_created: '仓库已创建',
    coding: '编码中',
    testing: '测试中',
    code_review: '待审核',
    revision: '修改中',
    ready: '待发货',
    delivered: '已发货',
    accepted: '客户已确认',
    disputed: '争议中',
    cancelled: '已取消',
    expired: '已过期',
  }
  return map[status]
}

function getPreviewKind(file: FileItem): 'image' | 'pdf' | 'code' | 'other' {
  const name = file.filename_original.toLowerCase()
  if (/\.(png|jpg|jpeg|gif|webp|bmp)$/.test(name)) return 'image'
  if (/\.pdf$/.test(name)) return 'pdf'
  if (/\.(js|ts|tsx|jsx|py|java|go|rs|json|md|yaml|yml|txt)$/.test(name)) return 'code'
  return 'other'
}

export default function OrderView() {
  const { hash } = useParams<{ hash: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [order, setOrder] = React.useState<Order | null>(null)
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [timeline, setTimeline] = React.useState<TimelineEvent[]>([])
  const [summary, setSummary] = React.useState<{ summary: string; highlights: string[] }>({
    summary: '',
    highlights: [],
  })
  const [feedback, setFeedback] = React.useState('')
  const [uploading, setUploading] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!hash) return
    setLoading(true)
    try {
      const [infoRes, filesRes, timelineRes, summaryRes] = await Promise.all([
        clientApi.getInfo(hash),
        clientApi.getFiles(hash),
        clientApi.getTimeline(hash),
        clientApi.getConversationSummary(hash).catch(() => ({ data: { summary: '', highlights: [] } })),
      ])
      setOrder(infoRes.data)
      setFiles(filesRes.data.files)
      setTimeline(timelineRes.data.items)
      setSummary(summaryRes.data)
    } catch {
      addToast({ title: '订单链接无效或已失效', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [addToast, hash])

  React.useEffect(() => {
    load()
  }, [load])

  const onUpload = async (file: File) => {
    if (!hash) return
    setUploading(true)
    try {
      await clientApi.uploadFile(hash, file)
      await load()
      addToast({ title: '文件上传成功', variant: 'success' })
    } catch {
      addToast({ title: '上传失败', variant: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const onConfirmRequirements = async () => {
    if (!hash) return
    try {
      await clientApi.confirmRequirements(hash)
      addToast({ title: '需求已确认', variant: 'success' })
      await load()
    } catch {
      addToast({ title: '确认失败', variant: 'error' })
    }
  }

  const onSubmitFeedback = async () => {
    if (!hash || !feedback.trim()) return
    try {
      await clientApi.submitRequirementFeedback(hash, feedback.trim())
      setFeedback('')
      addToast({ title: '反馈已提交', variant: 'success' })
      await load()
    } catch {
      addToast({ title: '提交失败', variant: 'error' })
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">加载中...</div>
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center">
          <p>订单不存在或链接无效</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const requirementFiles = files.filter((f) => f.file_type === 'req')
  const deliverables = files.filter((f) => f.file_type === 'delivery' || f.file_type === 'source' || f.file_type === 'screenshot')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Button>
          <div className="text-sm text-muted-foreground">
            订单 #{order.id} · {statusText(order.status)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 lg:grid-cols-[2fr_3fr]">
        <section className="space-y-4">
          <article className="rounded-xl border border-border/60 bg-card/70 p-4">
            <h1 className="text-xl font-semibold">{order.client_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              创建时间：{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
            </p>
            <p className="mt-3 text-sm">{order.description || '暂无描述'}</p>
          </article>

          <article className="rounded-xl border border-border/60 bg-card/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              需求文档与确认
            </div>

            <div className="space-y-2">
              <div className="rounded-md border border-border/40 bg-background/50 p-3 text-sm">
                <div className="font-medium">需求摘要</div>
                <p className="mt-1 text-muted-foreground">{order.requirements?.summary || '暂无摘要'}</p>
              </div>
              <div className="rounded-md border border-border/40 bg-background/50 p-3 text-sm">
                <div className="font-medium">功能点</div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {(order.requirements?.features || []).map((item, idx) => (
                    <li key={`${item.name}-${idx}`}>
                      {item.name}
                      {item.description ? `：${item.description}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button className="gap-2" onClick={onConfirmRequirements}>
                <CheckCircle2 className="h-4 w-4" />
                确认需求
              </Button>
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="如有误差，请写下需要修改的内容"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button variant="secondary" onClick={onSubmitFeedback}>
                提交反馈
              </Button>
            </div>

            <div className="mt-4 rounded-md border border-dashed border-border/60 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <UploadCloud className="h-4 w-4" />
                {uploading ? '上传中...' : '上传补充需求文件'}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {requirementFiles.length > 0 && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {requirementFiles.map((file) => (
                    <div key={file.id}>{file.filename_original}</div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-border/60 bg-card/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              沟通摘要
            </div>
            <p className="text-sm text-muted-foreground">{summary.summary || '暂无摘要'}</p>
            {summary.highlights.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {summary.highlights.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="space-y-4">
          <article className="rounded-xl border border-border/60 bg-card/70 p-4">
            <h2 className="mb-3 text-sm font-semibold">进度时间线</h2>
            <div className="space-y-2">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无时间线</p>
              ) : (
                timeline.map((item) => (
                  <div key={item.id} className="rounded-md border border-border/40 bg-background/50 p-2">
                    <div className="text-sm font-medium">
                      {item.event_type} · {item.actor}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    </div>
                    <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {JSON.stringify(item.event_data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-xl border border-border/60 bg-card/70 p-4">
            <h2 className="mb-3 text-sm font-semibold">交付物预览与下载</h2>
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无交付物</p>
            ) : (
              <div className="space-y-3">
                {deliverables.map((file) => {
                  const previewKind = getPreviewKind(file)
                  const previewUrl = `/api/v1/files/download/${file.id}?access_key=${order.access_key}`

                  return (
                    <div key={file.id} className="rounded-md border border-border/40 bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{file.filename_original}</div>
                          <div className="text-xs text-muted-foreground">{file.file_type}</div>
                        </div>
                        <Button size="sm" onClick={() => fileApi.download(file.id, order.access_key)} className="gap-1">
                          <Download className="h-4 w-4" />
                          下载
                        </Button>
                      </div>

                      {previewKind === 'image' && (
                        <img src={previewUrl} alt={file.filename_original} className="mt-2 max-h-52 rounded border border-border/30 object-contain" />
                      )}
                      {previewKind === 'pdf' && (
                        <iframe title={file.filename_original} src={previewUrl} className="mt-2 h-56 w-full rounded border border-border/30" />
                      )}
                      {previewKind === 'code' && (
                        <div className="mt-2 rounded border border-border/30 bg-muted/30 p-2 text-xs text-muted-foreground">
                          代码文件支持在线下载后本地查看
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

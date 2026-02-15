import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ORDER_STATUS_MAP,
  formatPrice,
  type FeedItem,
} from "@/lib/data"
import { useFeed } from "@/hooks/use-feed"

export function Feed() {
  const { data, isLoading, error, refresh } = useFeed()
  const { feedItems } = data

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">加载失败: {error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          className="gap-1 border-[#30363d] text-xs text-[#e6edf3]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重试
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <FeedSkeleton />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#e6edf3]">订单动态</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="h-7 w-7 text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
          title="刷新"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Order cards */}
      {feedItems.map((item) => (
        <OrderCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// --- Skeleton ---

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-[#21262d]" />
        <div className="h-7 w-7 rounded bg-[#21262d]" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-[#30363d] p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#21262d]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-[#21262d]" />
              <div className="h-5 w-48 rounded bg-[#21262d]" />
              <div className="h-3 w-full rounded bg-[#21262d]" />
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-full bg-[#21262d]" />
                <div className="h-5 w-14 rounded-full bg-[#21262d]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Order Card ---

function OrderCard({ item }: { item: FeedItem }) {
  const statusInfo = ORDER_STATUS_MAP[item.status]

  return (
    <div className="rounded-lg border border-[#30363d] p-4 transition-colors hover:border-[#484f58]">
      {/* Buyer info */}
      <div className="flex items-start gap-3">
        <img
          src={item.buyer.avatarUrl}
          alt={item.buyer.username}
          className="h-10 w-10 rounded-full border border-[#30363d]"
        />
        <div className="flex-1 min-w-0">
          {/* Top row: username + status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[#e6edf3]">
              {item.buyer.username}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Order title */}
          <h3 className="mt-1 text-sm font-semibold text-[#e6edf3]">
            {item.title}
          </h3>

          {/* Order description */}
          <p className="mt-1 text-xs leading-relaxed text-[#7d8590] line-clamp-2">
            {item.description}
          </p>

          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-xs text-[#7d8590]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer: price + time */}
          <div className="mt-3 flex items-center justify-between text-xs text-[#7d8590]">
            <span className="font-medium text-[#f0883e]">
              {formatPrice(item.price)}
            </span>
            <span>{item.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

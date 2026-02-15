import { useState, useEffect, useCallback } from "react"
import {
  feedItems as mockFeedItems,
  type FeedItem,
} from "@/lib/data"

export interface FeedData {
  feedItems: FeedItem[]
}

export interface UseFeedReturn {
  data: FeedData
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Feed 数据逻辑 hook
 *
 * 当前使用 mock 数据，后续对接后端时只需替换 fetchFeedData 的实现即可。
 * 对外暴露 data / isLoading / error / refresh，UI 层无需关心数据来源。
 */
export function useFeed(): UseFeedReturn {
  const [data, setData] = useState<FeedData>({
    feedItems: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: 对接后端 API 时替换为真实请求
      // const res = await fetch("/api/v1/dashboard/feed")
      // const json = await res.json()
      // setData(json)

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 300))

      setData({
        feedItems: mockFeedItems,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedData()
  }, [fetchFeedData])

  return { data, isLoading, error, refresh: fetchFeedData }
}

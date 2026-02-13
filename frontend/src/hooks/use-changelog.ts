import { useState, useEffect, useCallback } from "react"
import {
  changelogItems as mockChangelogItems,
  type ChangelogItem,
} from "@/lib/data"

export interface UseChangelogReturn {
  items: ChangelogItem[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Changelog 数据逻辑 hook
 *
 * 当前使用 mock 数据，后续对接后端时只需替换 fetchChangelog 的实现即可。
 * 对外暴露 items / isLoading / error / refresh，UI 层无需关心数据来源。
 */
export function useChangelog(): UseChangelogReturn {
  const [items, setItems] = useState<ChangelogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChangelog = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: 对接后端 API 时替换为真实请求
      // const res = await fetch("/api/v1/dashboard/changelog")
      // const json = await res.json()
      // setItems(json.items)

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 200))

      setItems(mockChangelogItems)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load changelog"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChangelog()
  }, [fetchChangelog])

  return { items, isLoading, error, refresh: fetchChangelog }
}

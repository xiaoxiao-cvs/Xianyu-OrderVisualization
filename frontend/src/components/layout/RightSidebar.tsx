import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChangelog } from "@/hooks/use-changelog"
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"

export function RightSidebar() {
  const { items, isLoading, error, refresh } = useChangelog()

  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-16 py-6 pl-6">
        {/* Latest from changelog */}
        <div className="mt-10 rounded-lg border border-[#30363d] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#e6edf3]">
              Latest from our changelog
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className="h-6 w-6 text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
              title="Refresh changelog"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {error && (
            <p className="mb-3 text-xs text-red-400">
              Failed to load: {error}
            </p>
          )}

          {isLoading ? (
            <ChangelogSkeleton />
          ) : (
            <Timeline defaultValue={items.length}>
              {items.map((item, index) => (
                <TimelineItem key={item.id} step={index + 1} className="not-last:pb-6">
                  <TimelineHeader>
                    <TimelineSeparator className="bg-[#30363d]" />
                    <TimelineDate className="text-xs text-[#7d8590]">
                      {item.date}
                    </TimelineDate>
                    <TimelineIndicator className="size-3 border-0 bg-[#30363d]" />
                  </TimelineHeader>
                  <TimelineContent>
                    <a
                      href={item.url}
                      className="text-sm leading-snug text-[#2f81f7] hover:underline"
                    >
                      {item.title}
                    </a>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}

          <a
            href="#"
            className="mt-4 inline-block text-xs text-[#7d8590] hover:text-[#2f81f7]"
          >
            View changelog →
          </a>
        </div>
      </div>
    </aside>
  )
}

function ChangelogSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#21262d]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-16 rounded bg-[#21262d]" />
            <div className="h-4 w-full rounded bg-[#21262d]" />
          </div>
        </div>
      ))}
    </div>
  )
}

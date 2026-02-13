import { changelogItems } from "@/lib/data"
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
  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-16 py-6 pl-6">
        {/* Latest from changelog */}
        <div className="mt-10 rounded-lg border border-[#30363d] p-4">
          <h2 className="mb-4 text-sm font-semibold text-[#e6edf3]">
            Latest from our changelog
          </h2>

          <Timeline defaultValue={changelogItems.length}>
            {changelogItems.map((item, index) => (
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

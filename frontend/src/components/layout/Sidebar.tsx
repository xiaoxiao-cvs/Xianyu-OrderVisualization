import { LayoutDashboard } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", active: true },
]

export function Sidebar() {
  const { isPinned, isHovered, isVisible, setHovered } = useSidebar()

  return (
    <>
      {/* 悬停触发区域 — 侧边栏收起时，左侧边缘的隐形热区 */}
      {!isPinned && !isHovered && (
        <div
          className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-1.5"
          onMouseEnter={() => setHovered(true)}
        />
      )}

      {/* 侧边栏面板 */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-60 flex-col",
          "border-r border-[#30363d] bg-[#010409]",
          "transition-transform duration-200 ease-in-out",
          isVisible ? "translate-x-0" : "-translate-x-full",
          // 悬停覆盖模式下加阴影
          !isPinned && isHovered && "shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
        )}
        onMouseEnter={() => {
          if (!isPinned) setHovered(true)
        }}
        onMouseLeave={() => {
          if (!isPinned) setHovered(false)
        }}
      >
        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-[#1f6feb]/15 text-white"
                  : "text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
              )}
            >
              {/* 左侧高亮指示条 */}
              {item.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#1f6feb]" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* 占位区 — 固定展开时撑开布局，收起时宽度为 0 */}
      <div
        className={cn(
          "shrink-0 transition-all duration-200 ease-in-out",
          isPinned ? "w-60" : "w-0"
        )}
      />
    </>
  )
}

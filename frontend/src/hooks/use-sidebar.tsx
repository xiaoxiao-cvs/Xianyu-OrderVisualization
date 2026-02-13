import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

interface SidebarState {
  /** 侧边栏是否处于固定展开状态（由 toggle 按钮控制） */
  isPinned: boolean
  /** 侧边栏是否因鼠标悬停而临时展开 */
  isHovered: boolean
  /** 计算属性：侧边栏是否可见 */
  isVisible: boolean
  /** 切换固定展开状态 */
  toggle: () => void
  /** 设置悬停状态 */
  setHovered: (value: boolean) => void
}

const SidebarContext = createContext<SidebarState | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isPinned, setIsPinned] = useState(true) // 默认展开
  const [isHovered, setIsHovered] = useState(false)

  const toggle = useCallback(() => {
    setIsPinned((prev) => !prev)
    setIsHovered(false)
  }, [])

  const isVisible = isPinned || isHovered

  return (
    <SidebarContext.Provider
      value={{ isPinned, isHovered, isVisible, toggle, setHovered: setIsHovered }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

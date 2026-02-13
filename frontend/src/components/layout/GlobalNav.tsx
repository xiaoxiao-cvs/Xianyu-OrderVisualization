import {
  Bell,
  BookOpen,
  ChevronDown,
  GitPullRequest,
  CircleDot,
  Plus,
  Search,
  MessageCircle,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/hooks/use-sidebar"

export function GlobalNav() {
  const { toggle } = useSidebar()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#30363d] bg-[#010409]">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-[#21262d]"
                onClick={toggle}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sidebar</TooltipContent>
          </Tooltip>

          {/* GitHub Logo */}
          <a href="/" className="text-white hover:text-[#c9d1d9]">
            <svg height="32" viewBox="0 0 16 16" width="32" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
          </a>

          {/* Dashboard breadcrumb */}
          <nav className="flex items-center gap-1">
            <a
              href="/"
              className="text-sm font-semibold text-white hover:text-[#c9d1d9]"
            >
              Dashboard
            </a>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="hidden lg:block">
            <div className="flex h-8 w-72 items-center rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#7d8590]">
              <Search className="mr-2 h-3.5 w-3.5" />
              <span>Type</span>
              <kbd className="ml-1 rounded border border-[#30363d] bg-[#161b22] px-1.5 font-mono text-xs text-[#7d8590]">/</kbd>
              <span className="ml-1">to search</span>
            </div>
          </div>

          {/* Grouped icon buttons with border */}
          <div className="flex items-center rounded-md border border-[#30363d]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md text-[#e6edf3] hover:bg-[#21262d]">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat with Copilot</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-[#30363d]" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-0.5 rounded-none rounded-r-md px-2 text-[#e6edf3] hover:bg-[#21262d]">
                  <Plus className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create new...</TooltipContent>
            </Tooltip>
          </div>

          {/* Nav links grouped with border */}
          <div className="flex items-center rounded-md border border-[#30363d]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md text-[#e6edf3] hover:bg-[#21262d]">
                  <CircleDot className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Issues</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-[#30363d]" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-[#e6edf3] hover:bg-[#21262d]">
                  <GitPullRequest className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pull requests</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-[#30363d]" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md text-[#e6edf3] hover:bg-[#21262d]">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Repositories</TooltipContent>
            </Tooltip>
          </div>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-md border border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#1f6feb]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>You have unread notifications</TooltipContent>
          </Tooltip>

          {/* User Avatar - bigger */}
          <button className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-transparent hover:ring-[#30363d]">
            <img
              src="https://avatars.githubusercontent.com/u/132777740?s=40&v=4"
              alt="@xiaoxiao-cvs"
              className="h-8 w-8 rounded-full"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

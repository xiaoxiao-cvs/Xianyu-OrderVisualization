import {
  ChevronDown,
  Paperclip,
  Send,
  Sparkles,
  GitBranch,
  GitPullRequest,
  CircleDot,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function CopilotChat() {
  return (
    <div className="flex flex-col gap-4">
      {/* Ask anything input */}
      <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3">
        <Textarea
          placeholder="Ask anything"
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-0"
        />

        {/* Toolbar */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Attach repos */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 rounded-md text-xs text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
              </svg>
              <ChevronDown className="h-3 w-3" />
            </Button>

            {/* Attach files */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 rounded-md text-xs text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Model selector */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 rounded-md text-xs text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Claude Sonnet 4.5</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Send button */}
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-[#238636] text-white hover:bg-[#2ea043]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Commands */}
      <div>
        <h2 className="mb-2 text-xs font-semibold text-[#7d8590]">
          Chat Commands
        </h2>
        <div className="flex flex-wrap gap-2">
          <CommandButton icon={<Zap className="h-3.5 w-3.5" />} label="Task" />
          <CommandButton
            icon={<CircleDot className="h-3.5 w-3.5" />}
            label="Create issue"
          />
          <CommandButton
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Spark"
          />
          <CommandButton
            icon={<GitBranch className="h-3.5 w-3.5" />}
            label="Git"
            hasChevron
          />
          <CommandButton
            icon={<GitPullRequest className="h-3.5 w-3.5" />}
            label="Pull requests"
            hasChevron
          />
        </div>
      </div>
    </div>
  )
}

function CommandButton({
  icon,
  label,
  hasChevron = false,
}: {
  icon: React.ReactNode
  label: string
  hasChevron?: boolean
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 rounded-full border-[#30363d] bg-[#21262d] text-xs text-[#e6edf3] hover:border-[#8b949e] hover:bg-[#30363d]"
    >
      {icon}
      {label}
      {hasChevron && <ChevronDown className="h-3 w-3 text-[#7d8590]" />}
    </Button>
  )
}

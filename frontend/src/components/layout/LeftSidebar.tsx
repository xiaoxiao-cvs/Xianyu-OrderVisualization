import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { topRepositories, userProfile } from "@/lib/data"

export function LeftSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-16 flex flex-col gap-4 py-6 pr-6">
        {/* User Profile */}
        <div className="flex items-center gap-2">
          <img
            src={userProfile.avatarUrl}
            alt={`@${userProfile.username}`}
            className="h-5 w-5 rounded-full"
          />
          <button className="flex items-center gap-1 text-sm text-[#e6edf3] hover:text-white">
            <span className="font-medium">{userProfile.username}</span>
            <svg
              className="h-4 w-4 text-[#7d8590]"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
            </svg>
          </button>
        </div>

        {/* Repositories Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#e6edf3]">
              Top repositories
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs font-medium text-[#e6edf3] hover:bg-[#30363d] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          {/* Search */}
          <div className="mt-3">
            <Input
              placeholder="Find a repository…"
              className="h-[30px] border-[#30363d] bg-[#0d1117] text-xs text-[#e6edf3] placeholder:text-[#484f58] focus-visible:border-[#1f6feb] focus-visible:ring-0"
            />
          </div>

          {/* Repository List */}
          <nav className="mt-3 flex flex-col gap-0.5">
            {topRepositories.map((repo) => (
              <a
                key={repo.id}
                href="#"
                className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-[#e6edf3] hover:bg-[#21262d]"
              >
                <img
                  src={repo.avatarUrl}
                  alt={repo.owner}
                  className="h-4 w-4 rounded-full"
                />
                <span className="truncate">
                  <span className="text-[#7d8590]">{repo.owner}</span>
                  <span className="text-[#7d8590]">/</span>
                  <span className="font-semibold">{repo.name}</span>
                </span>
              </a>
            ))}
          </nav>

          {/* Show more */}
          <button className="mt-2 text-xs text-[#7d8590] hover:text-[#2f81f7]">
            Show more
          </button>
        </div>
      </div>
    </aside>
  )
}

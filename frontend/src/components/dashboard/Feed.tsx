import { MoreHorizontal, Star, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  feedItems,
  trendingRepos,
  popularRepos,
  formatStars,
  type Repository,
  type FeedItem,
} from "@/lib/data"

export function Feed() {
  return (
    <div className="flex flex-col gap-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#e6edf3]">Feed</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs text-[#e6edf3] hover:bg-[#30363d]"
        >
          Filter
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
          </svg>
        </Button>
      </div>

      {/* Feed Item - Follow (sicusa) */}
      <div className="rounded-lg border border-[#30363d] p-4">
        <FollowFeedItem item={feedItems[0]} />
      </div>

      {/* Feed Item - Star */}
      <div className="rounded-lg border border-[#30363d] p-4">
        <StarFeedItem item={feedItems[1]} />
      </div>

      {/* Trending Repositories */}
      <div className="rounded-lg border border-[#30363d]">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#e6edf3]">
            Trending repositories
          </h3>
          <span className="text-[#7d8590]">·</span>
          <a href="#" className="text-xs text-[#7d8590] hover:text-[#2f81f7]">
            See more
          </a>
        </div>
        {trendingRepos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>

      {/* Popular projects */}
      <div className="rounded-lg border border-[#30363d]">
        <div className="border-b border-[#30363d] px-4 py-3">
          <span className="text-xs text-[#7d8590]">
            Popular projects among{" "}
            <a href="#" className="text-[#2f81f7] hover:underline">
              people you follow
            </a>
          </span>
        </div>
        {popularRepos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>

      {/* Feed Item - Follow (lei6622) */}
      <div className="rounded-lg border border-[#30363d] p-4">
        <FollowFeedItem item={feedItems[2]} />
      </div>

      {/* Feed Item - Follow (weakdreamer) */}
      <div className="rounded-lg border border-[#30363d] p-4">
        <FollowFeedItem item={feedItems[3]} />
      </div>
    </div>
  )
}

// --- Sub Components ---

function FollowFeedItem({ item }: { item: FeedItem }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <a href="#">
          <img
            src={item.actor.avatarUrl}
            alt={`@${item.actor.username}`}
            className="h-8 w-8 rounded-full"
          />
        </a>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#e6edf3]">
              <a href="#" className="font-semibold hover:text-[#2f81f7]">
                {item.actor.username}
              </a>{" "}
              <span className="text-[#7d8590]">started following</span>{" "}
              <span className="font-semibold">you</span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-[#7d8590]">{item.timestamp}</p>
        </div>
      </div>

      {/* User card */}
      <div className="ml-11 rounded-lg border border-[#30363d] p-4">
        <div className="flex items-start gap-3">
          <a href="#">
            <img
              src={item.actor.avatarUrl}
              alt={`@${item.actor.username}`}
              className="h-12 w-12 rounded-full"
            />
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a href="#" className="text-sm font-semibold text-[#e6edf3] hover:text-[#2f81f7]">
                  {item.actor.displayName || item.actor.username}
                </a>
                <span className="ml-1 text-xs text-[#7d8590]">
                  {item.actor.username}
                </span>
                {item.actor.bio && (
                  <p className="mt-1 text-xs text-[#7d8590] line-clamp-2">
                    {item.actor.bio}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[#7d8590]">
                  {item.actor.repoCount !== undefined && (
                    <span>{item.actor.repoCount} repositories</span>
                  )}
                  {item.actor.followerCount !== undefined && (
                    <span>
                      {item.actor.followerCount} follower{item.actor.followerCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 rounded-md border-[#30363d] bg-[#21262d] px-3 text-xs text-[#e6edf3] hover:border-[#8b949e] hover:bg-[#30363d]"
              >
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StarFeedItem({ item }: { item: FeedItem }) {
  if (!item.repository) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <a href="#">
          <img
            src={item.actor.avatarUrl}
            alt={`@${item.actor.username}`}
            className="h-8 w-8 rounded-full"
          />
        </a>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#e6edf3]">
              <a href="#" className="font-semibold hover:text-[#2f81f7]">
                {item.actor.username}
              </a>{" "}
              <span className="text-[#7d8590]">starred</span>{" "}
              <span className="font-semibold">your repository</span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-[#7d8590]">{item.timestamp}</p>
        </div>
      </div>

      {/* Repo card */}
      <div className="ml-11">
        <RepoCard repo={item.repository} />
      </div>
    </div>
  )
}

function RepoCard({ repo }: { repo: Repository }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#30363d] p-4 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <img
            src={repo.avatarUrl}
            alt={repo.owner}
            className="h-5 w-5 rounded-full"
          />
          <a
            href="#"
            className="text-sm font-semibold text-[#2f81f7] hover:underline"
          >
            {repo.owner}/{repo.name}
          </a>
        </div>
        {repo.description && (
          <p className="mt-1 text-xs text-[#7d8590] line-clamp-2">
            {repo.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-[#7d8590]">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: repo.languageColor || "#ccc" }}
              />
              {repo.language}
            </span>
          )}
          {repo.stars > 0 && (
            <a href="#" className="flex items-center gap-1 hover:text-[#2f81f7]">
              <Star className="h-3.5 w-3.5" />
              {formatStars(repo.stars)}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-md border-[#30363d] bg-[#21262d] px-3 text-xs text-[#e6edf3] hover:border-[#8b949e] hover:bg-[#30363d]"
        >
          <Star className="h-3.5 w-3.5" />
          Star
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#7d8590] hover:bg-[#21262d] hover:text-[#e6edf3]"
        >
          <BookMarked className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

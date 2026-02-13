import { cn } from "@/lib/utils"

// Mock data types
export interface Repository {
  id: string
  owner: string
  name: string
  avatarUrl: string
  description?: string
  language?: string
  languageColor?: string
  stars: number
}

export interface FeedItem {
  id: string
  type: "follow" | "star" | "trending" | "popular"
  actor: {
    username: string
    displayName?: string
    avatarUrl: string
    bio?: string
    repoCount?: number
    followerCount?: number
  }
  target?: string
  timestamp: string
  repository?: Repository
}

export interface ChangelogItem {
  id: string
  date: string
  title: string
  url: string
}

// Mock Data
export const userProfile = {
  username: "xiaoxiao-cvs",
  avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=40&v=4",
}

export const topRepositories: Repository[] = [
  {
    id: "1",
    owner: "xiaoxiao-cvs",
    name: "mailauncher",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 0,
  },
  {
    id: "2",
    owner: "xiaoxiao-cvs",
    name: "WB-WebAPP",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 0,
  },
  {
    id: "3",
    owner: "xiaoxiao-cvs",
    name: "test_repo2",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 0,
  },
  {
    id: "4",
    owner: "xiaoxiao-cvs",
    name: "Document-Q-A",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 1,
  },
  {
    id: "5",
    owner: "xiaoxiao-cvs",
    name: "Convenient-access",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 0,
  },
  {
    id: "6",
    owner: "xiaoxiao-cvs",
    name: "Xianyu-OrderVisualization",
    avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=16&v=4",
    stars: 0,
  },
  {
    id: "7",
    owner: "World-of-Kivotos",
    name: "World-of-Kivotos_Web",
    avatarUrl: "https://avatars.githubusercontent.com/u/226046457?s=16&v=4",
    stars: 0,
  },
]

export const feedItems: FeedItem[] = [
  {
    id: "1",
    type: "follow",
    actor: {
      username: "sicusa",
      displayName: "Phlamcenth Sicusa",
      avatarUrl: "https://avatars.githubusercontent.com/u/1961145?s=80&v=4",
      bio: "𝐻𝑜𝓉𝒽 𝓂𝑒𝓁𝓊𝑒𝓂𝒸𝓊𝒶 𝓁𝒶𝓃'𝒶𝒾. / 愿你在此寻到光辉。",
      repoCount: 11,
      followerCount: 103,
    },
    timestamp: "last week",
  },
  {
    id: "2",
    type: "star",
    actor: {
      username: "lei6622",
      avatarUrl: "https://avatars.githubusercontent.com/u/174229280?s=80&v=4",
    },
    timestamp: "3 weeks ago",
    repository: {
      id: "r1",
      owner: "xiaoxiao-cvs",
      name: "Document-Q-A",
      avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=40&v=4",
      description: "毕业设计：通过调用大模型API，返回基于文档内容的答案，并指出答案来自文档的哪一页或哪一段",
      language: "TypeScript",
      languageColor: "#3178c6",
      stars: 1,
    },
  },
  {
    id: "3",
    type: "follow",
    actor: {
      username: "lei6622",
      displayName: "mary",
      avatarUrl: "https://avatars.githubusercontent.com/u/174229280?s=80&v=4",
      followerCount: 1,
    },
    timestamp: "3 weeks ago",
  },
  {
    id: "4",
    type: "follow",
    actor: {
      username: "weakdreamer",
      displayName: "临观",
      avatarUrl: "https://avatars.githubusercontent.com/u/78489726?s=80&v=4",
      bio: "这个入不会写代码，只会用自然语言鞭策 AI ，试图写出能跑的程序——GPT 把这套路叫做 NPC（Natural→Protocol→Concrete）。 希望有一天能通过这种方式，使得个人实现更全面和自由的发展。",
      repoCount: 2,
    },
    timestamp: "last month",
  },
]

export const trendingRepos: Repository[] = [
  {
    id: "t1",
    owner: "sipeed",
    name: "picoclaw",
    avatarUrl: "https://avatars.githubusercontent.com/u/44034752?s=40&v=4",
    description: "picoclaw",
    language: "Go",
    languageColor: "#00ADD8",
    stars: 5200,
  },
  {
    id: "t2",
    owner: "koala73",
    name: "worldmonitor",
    avatarUrl: "https://avatars.githubusercontent.com/u/996596?s=40&v=4",
    description: "Real-time global intelligence dashboard — AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface",
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 2600,
  },
]

export const popularRepos: Repository[] = [
  {
    id: "p1",
    owner: "OpenXiangShan",
    name: "XiangShan",
    avatarUrl: "https://avatars.githubusercontent.com/u/66780499?s=40&v=4",
    description: "Open-source high-performance RISC-V processor",
    language: "Scala",
    languageColor: "#c22d40",
    stars: 6900,
  },
]

export const changelogItems: ChangelogItem[] = [
  {
    id: "c1",
    date: "2 days ago",
    title: "GitHub Mobile: Model picker for Copilot coding agent",
    url: "#",
  },
  {
    id: "c2",
    date: "3 days ago",
    title: "Track additional Dependabot configuration changes in audit logs",
    url: "#",
  },
  {
    id: "c3",
    date: "4 days ago",
    title: "GPT-5.3-Codex is now generally available for GitHub Copilot",
    url: "#",
  },
  {
    id: "c4",
    date: "4 days ago",
    title: "GitHub Apps can now utilize public preview Enterprise Teams APIs via fine-grained permissions",
    url: "#",
  },
]

// Helper to format star count
export function formatStars(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  }
  return count.toString()
}

export { cn }

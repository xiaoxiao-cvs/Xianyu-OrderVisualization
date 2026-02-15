import { cn } from "@/lib/utils"

// Mock data types — 闲鱼订单可视化

/** 订单状态 */
export type OrderStatus =
  | "pending"      // 待处理
  | "in_progress"  // 进行中
  | "shipped"      // 已发货
  | "completed"    // 已完成
  | "cancelled"    // 已取消

/** 订单 Feed 卡片 */
export interface FeedItem {
  id: string
  buyer: {
    username: string
    avatarUrl: string
  }
  title: string          // 订单概括
  description: string    // 订单简介
  tags: string[]         // 标签
  status: OrderStatus    // 当前状态
  price: number          // 价格 (元)
  timestamp: string      // 时间
}

/** 更新日志条目 */
export interface ChangelogItem {
  id: string
  date: string
  title: string
  /** 可选的关联订单号 */
  orderId?: string
}

// Mock Data
export const userProfile = {
  username: "xiaoxiao-cvs",
  avatarUrl: "https://avatars.githubusercontent.com/u/132777740?s=40&v=4",
}

export const feedItems: FeedItem[] = [
  {
    id: "1",
    buyer: {
      username: "小明同学",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Nolan",
    },
    title: "Python爬虫脚本定制开发",
    description:
      "需要一个能自动抓取电商平台商品信息的爬虫脚本，支持多平台、自动翻页、数据导出为Excel。要求代码规范、有注释。",
    tags: ["Python", "爬虫", "定制开发"],
    status: "in_progress",
    price: 299,
    timestamp: "2 小时前",
  },
  {
    id: "2",
    buyer: {
      username: "设计师小王",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Callie",
    },
    title: "个人作品集网站搭建",
    description:
      "帮忙搭建一个响应式个人作品集网站，要求简约风格，支持图片/视频展示，带联系表单，部署到Vercel。",
    tags: ["前端", "React", "网站搭建"],
    status: "shipped",
    price: 450,
    timestamp: "昨天",
  },
]

export const changelogItems: ChangelogItem[] = [
  {
    id: "c1",
    date: "10 分钟前",
    title: "订单「Python爬虫脚本定制开发」AI 已完成核心代码编写",
    orderId: "1",
  },
  {
    id: "c2",
    date: "2 小时前",
    title: "订单「个人作品集网站搭建」已发货，等待买家确认",
    orderId: "2",
  },
  {
    id: "c3",
    date: "昨天",
    title: "订单「个人作品集网站搭建」通过代码审查，准备打包交付",
    orderId: "2",
  },
  {
    id: "c4",
    date: "2 天前",
    title: "订单「Python爬虫脚本定制开发」买家已下单，开始需求分析",
    orderId: "1",
  },
]

/** 订单状态的中文标签与颜色 */
export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending:     { label: "待处理", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  in_progress: { label: "进行中", color: "text-blue-400",   bg: "bg-blue-400/10" },
  shipped:     { label: "已发货", color: "text-purple-400", bg: "bg-purple-400/10" },
  completed:   { label: "已完成", color: "text-green-400",  bg: "bg-green-400/10" },
  cancelled:   { label: "已取消", color: "text-red-400",    bg: "bg-red-400/10" },
}

// Helper to format price
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

export { cn }

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Moon, Sun, Settings } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

// 方块装饰组件
function DecorativeBlocks() {
  const blocks = [
    { size: 'w-16 h-16', delay: 0, x: 0, y: 0 },
    { size: 'w-24 h-24', delay: 0.1, x: 20, y: 20 },
    { size: 'w-12 h-12', delay: 0.2, x: 80, y: 10 },
    { size: 'w-20 h-20', delay: 0.15, x: 40, y: 90 },
    { size: 'w-14 h-14', delay: 0.25, x: 100, y: 70 },
    { size: 'w-32 h-32', delay: 0.05, x: 60, y: 140 },
    { size: 'w-10 h-10', delay: 0.3, x: 10, y: 170 },
    { size: 'w-18 h-18', delay: 0.2, x: 120, y: 120 },
    { size: 'w-8 h-8', delay: 0.35, x: 140, y: 30 },
    { size: 'w-28 h-28', delay: 0.1, x: 30, y: 220 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: block.delay,
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1],
          }}
          className={cn(
            block.size,
            'absolute rounded-2xl',
            'bg-gray-200/60 dark:bg-gray-700/40',
            'backdrop-blur-sm'
          )}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [orderCode, setOrderCode] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderCode.trim()) {
      navigate(`/order/${orderCode.trim()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      
      {/* 毛玻璃背景圆形装饰 */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />

      {/* 顶部导航 */}
      <header className="relative z-10 flex items-center justify-end gap-3 p-4 md:p-6">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={toggleTheme}
          className={cn(
            'p-3 rounded-2xl transition-all duration-300',
            'bg-card/80 backdrop-blur-md border border-border/50',
            'hover:bg-card hover:shadow-lg hover:scale-105',
            'active:scale-95'
          )}
          aria-label="切换主题"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/admin')}
          className={cn(
            'p-3 rounded-2xl transition-all duration-300',
            'bg-card/80 backdrop-blur-md border border-border/50',
            'hover:bg-card hover:shadow-lg hover:scale-105',
            'active:scale-95'
          )}
          aria-label="后台管理"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </motion.button>
      </header>

      {/* 主内容区域 */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)]">
        {/* 左侧装饰区域 */}
        <div className="hidden lg:block lg:w-1/2 relative p-12">
          <DecorativeBlocks />
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative z-10 mt-32"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              项目交付
              <br />
              <span className="text-primary">可视化平台</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md">
              简洁、高效的订单追踪与文件交付系统。
              <br />
              输入您的订单码，即可查看项目进度。
            </p>
          </motion.div>
        </div>

        {/* 右侧输入区域 */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* 移动端标题 */}
            <div className="lg:hidden text-center mb-10">
              <h1 className="text-3xl font-bold text-foreground">
                项目交付
                <span className="text-primary">平台</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                输入订单码查看项目进度
              </p>
            </div>

            {/* 输入卡片 */}
            <div
              className={cn(
                'rounded-3xl p-8 transition-all duration-300',
                'bg-card/80 backdrop-blur-xl border',
                isFocused
                  ? 'border-primary/50 shadow-xl shadow-primary/10'
                  : 'border-border/50 shadow-lg'
              )}
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">
                查询订单
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="请输入订单码..."
                    className={cn(
                      'w-full h-14 px-5 pr-14 rounded-2xl',
                      'bg-background/50 border border-border/50',
                      'text-foreground placeholder:text-muted-foreground',
                      'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                      'transition-all duration-300'
                    )}
                  />
                  <button
                    type="submit"
                    disabled={!orderCode.trim()}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2',
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      'transition-all duration-300',
                      orderCode.trim()
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                    aria-label="查询"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <p className="mt-4 text-sm text-muted-foreground">
                订单码由卖家提供，通常为8-12位字符
              </p>
            </div>

            {/* 底部装饰 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground/60">
                © 2026 项目交付平台
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

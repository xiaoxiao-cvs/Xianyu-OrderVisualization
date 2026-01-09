import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ArrowRight, Loader2, Moon, Sun, Home } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authApi.login({ password })
      localStorage.setItem('token', response.data.access_token)
      navigate('/admin')
    } catch {
      setError('管理员密钥错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/30" />
      
      {/* 毛玻璃背景装饰 */}
      <div className="absolute top-[-20%] right-[-10%] w-150 h-150 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-3xl" />

      {/* 顶部导航 */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
            'hover:bg-muted/50 active:scale-95'
          )}
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">返回首页</span>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
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
      </header>

      {/* 主内容 */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* 登录卡片 */}
          <div
            className={cn(
              'rounded-3xl p-8 transition-all duration-300',
              'bg-card/80 backdrop-blur-xl border shadow-lg',
              isFocused ? 'border-primary/50 shadow-xl shadow-primary/10' : 'border-border/50'
            )}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">管理后台</h1>
              <p className="mt-2 text-muted-foreground text-center">
                请输入管理员密钥登录
              </p>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  管理员密钥
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="请输入管理员密钥"
                    required
                    className={cn(
                      'w-full h-12 px-4 rounded-xl',
                      'bg-background/50 border border-border/50',
                      'text-foreground placeholder:text-muted-foreground',
                      'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className={cn(
                  'w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2',
                  'transition-all duration-200',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    登录
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 底部 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-muted-foreground/60"
          >
            © 2026 项目交付平台
          </motion.p>
        </motion.div>
      </main>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/30" />
      <div className="absolute top-[-20%] right-[-10%] w-150 h-150 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-30%] left-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative w-full max-w-md p-8 rounded-3xl text-center',
          'bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg'
        )}
      >
        <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">
          抱歉，您访问的页面不存在
        </p>
        <Link
          to="/"
          className={cn(
            'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-all duration-200',
            'active:scale-95'
          )}
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </motion.div>
    </div>
  )
}

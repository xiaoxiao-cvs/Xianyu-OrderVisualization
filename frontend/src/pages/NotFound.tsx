import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-10">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground text-center mb-6">
            抱歉，您访问的页面不存在
          </p>
          <Link to="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

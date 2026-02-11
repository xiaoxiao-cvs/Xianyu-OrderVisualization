import { createBrowserRouter } from 'react-router-dom'
import Home from '@/pages/Home'
import AdminLogin from '@/pages/admin/Login'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminNotifications from '@/pages/admin/Notifications'
import ClientOrderView from '@/pages/client/OrderView'
import NotFound from '@/pages/NotFound'
import AuthGuard from '@/components/AuthGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminDashboard />
      </AuthGuard>
    ),
  },
  {
    path: '/admin/notifications',
    element: (
      <AuthGuard>
        <AdminNotifications />
      </AuthGuard>
    ),
  },
  {
    path: '/order/:hash',
    element: <ClientOrderView />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

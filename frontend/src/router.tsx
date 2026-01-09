import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLogin from '@/pages/admin/Login'
import AdminDashboard from '@/pages/admin/Dashboard'
import ClientOrderView from '@/pages/client/OrderView'
import NotFound from '@/pages/NotFound'
import AuthGuard from '@/components/AuthGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
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
    path: '/order/:hash',
    element: <ClientOrderView />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

// 创建 Axios 实例
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request 拦截器：自动添加 Authorization Header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response 拦截器：全局错误处理
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      
      // 401: 未登录或 Token 过期
      if (status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      // 403: Hash 无效或无权限
      if (status === 403) {
        console.error('访问被拒绝')
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API 类型定义
export interface Order {
  id: number
  access_key: string
  client_name: string
  description: string | null
  status: 'pending' | 'processing' | 'delivered'
  expires_at: string | null
  created_at: string
}

export interface OrderListResponse {
  total: number
  items: Order[]
}

export interface OrderLog {
  id: number
  orderId: number
  action: string
  ip: string
  userAgent: string
  createdAt: string
}

export interface FileItem {
  id: number
  orderId: number
  fileName: string
  fileSize: number
  fileType: 'requirement' | 'delivery'
  uploadedAt: string
}

export interface LoginRequest {
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// API 方法
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
}

export const orderApi = {
  // 管理员接口
  list: () => api.get<OrderListResponse>('/orders/'),
  create: (data: { client_name: string; description?: string }) => api.post<Order>('/orders/', data),
  update: (id: number, data: Partial<Order>) => api.put<Order>(`/orders/${id}`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
  getLogs: (id: number) => api.get<OrderLog[]>(`/orders/${id}/logs`),
  
  // 客户接口（通过 hash 访问）
  getByHash: (hash: string) => api.get<Order>(`/orders/hash/${hash}`),
  getFilesByHash: (hash: string) => api.get<FileItem[]>(`/orders/hash/${hash}/files`),
}

export const fileApi = {
  upload: (orderId: number, file: File, type: 'requirement' | 'delivery', onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post<FileItem>(`/orders/${orderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },
  
  download: (fileId: number) => {
    window.open(`/api/v1/files/${fileId}/download`, '_blank')
  },
}

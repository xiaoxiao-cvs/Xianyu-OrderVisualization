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
  xianyu_order_id: string | null  // 闲鱼订单号
  client_name: string
  description: string | null
  status: 'temp' | 'pending' | 'dev' | 'delivered' | 'expired'
  expires_at: string | null
  created_at: string
}

export interface OrderListResponse {
  total: number
  items: Order[]
}

export interface OrderLog {
  id: number
  order_id: number
  ip_address: string
  user_agent: string
  action_type: string
  target_file: string | null
  timestamp: string
}

export interface OrderLogListResponse {
  total: number
  logs: OrderLog[]
}

export interface FileItem {
  id: number
  order_id: number
  filename_original: string
  filename_saved: string
  file_size: number
  file_type: 'req' | 'source'
  uploaded_at: string
  file_hash: string | null
  oss_key: string | null
  is_uploaded: boolean
  is_selected: boolean
}

export interface FileListResponse {
  files: FileItem[]
}

export interface LoginRequest {
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// OSS 直传相关类型
export interface OSSSignature {
  access_id: string
  policy: string
  signature: string
  dir: string
  host: string
  expire: number
  callback: string
}

export interface FileHashCheckResponse {
  exists: boolean
  file_id: number | null
  message: string
}

export interface OSSStatus {
  oss_enabled: boolean
  max_file_size_mb: number
  max_files_per_order: number
}

// 订单转正请求
export interface OrderConvertRequest {
  access_key: string
  xianyu_order_id: string
  selected_file_ids: number[]
  delete_unselected?: boolean
  notes?: string
}

// API 方法
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
}

export const orderApi = {
  // 管理员接口
  list: (params?: { skip?: number; limit?: number; status_filter?: string }) => 
    api.get<OrderListResponse>('/orders/', { params }),
  create: (data: { client_name: string; description?: string }) => api.post<Order>('/orders/', data),
  get: (id: number) => api.get<Order>(`/orders/${id}`),
  update: (id: number, data: Partial<Order>) => api.patch<Order>(`/orders/${id}`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
  getLogs: (id: number, params?: { skip?: number; limit?: number }) => 
    api.get<OrderLogListResponse>(`/orders/${id}/logs`, { params }),
  getFiles: (id: number, includeUnselected?: boolean) => 
    api.get<FileListResponse>(`/orders/${id}/files`, { params: { include_unselected: includeUnselected ?? true } }),
  
  // 通过 access_key (Hash) 操作
  getByHash: (hash: string) => api.get<Order>(`/orders/by-hash/${hash}`),
  getFilesByHash: (hash: string, includeUnselected?: boolean) => 
    api.get<FileListResponse>(`/orders/by-hash/${hash}/files`, { params: { include_unselected: includeUnselected ?? true } }),
  
  // 订单转正
  convert: (data: OrderConvertRequest) => api.post<Order>('/orders/convert', data),
}

// 客户端接口（通过 access_key 访问）
export const clientApi = {
  getInfo: (accessKey: string) => api.get<Order>(`/client/${accessKey}/info`),
  getFiles: (accessKey: string) => api.get<FileListResponse>(`/client/${accessKey}/files`),
  
  // OSS 相关
  getOSSStatus: (accessKey: string) => api.get<OSSStatus>(`/client/${accessKey}/oss-status`),
  checkFileHash: (accessKey: string, fileHash: string) => 
    api.post<FileHashCheckResponse>(`/client/${accessKey}/check-hash`, { file_hash: fileHash, access_key: accessKey }),
  getOSSSignature: (accessKey: string, fileHash: string, filename: string, contentType?: string) =>
    api.get<OSSSignature>(`/client/${accessKey}/oss-signature`, {
      params: { file_hash: fileHash, filename, content_type: contentType || 'application/octet-stream' }
    }),
  
  // 传统上传（OSS未启用时使用）
  uploadFile: (accessKey: string, file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post<FileItem>(`/client/${accessKey}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },
}

export const fileApi = {
  // 管理员上传
  upload: (accessKey: string, fileType: 'req' | 'source', file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post<FileItem>(`/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { access_key: accessKey, file_type: fileType },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
  },
  
  // 下载文件（使用 302 重定向方式）
  download: (fileId: number, accessKey?: string) => {
    const url = accessKey 
      ? `/api/v1/files/download/${fileId}?access_key=${accessKey}`
      : `/api/v1/files/download/${fileId}`
    // 使用 location.href 实现 302 重定向下载
    window.location.href = url
  },
  
  // 删除文件（管理员）
  delete: (fileId: number) => api.delete(`/files/${fileId}`),
}

// 计算文件 SHA256 哈希（用于查重和 OSS 上传）
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// OSS 直传上传函数
export async function uploadToOSS(
  signature: OSSSignature,
  file: File,
  _fileHash: string,  // 保留参数用于后续扩展
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const formData = new FormData()
  
  // OSS 要求的字段顺序
  formData.append('key', `${signature.dir}${file.name}`)
  formData.append('OSSAccessKeyId', signature.access_id)
  formData.append('policy', signature.policy)
  formData.append('Signature', signature.signature)
  formData.append('callback', signature.callback)
  formData.append('success_action_status', '200')
  formData.append('file', file)
  
  try {
    const response = await axios.post(signature.host, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
    return response.status === 200
  } catch (error) {
    console.error('OSS upload failed:', error)
    return false
  }
}

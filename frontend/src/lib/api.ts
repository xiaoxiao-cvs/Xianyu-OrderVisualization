import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export type OrderStatus =
  | 'draft'
  | 'collecting'
  | 'collected'
  | 'quoted'
  | 'confirmed'
  | 'repo_created'
  | 'coding'
  | 'testing'
  | 'code_review'
  | 'revision'
  | 'ready'
  | 'delivered'
  | 'accepted'
  | 'disputed'
  | 'cancelled'
  | 'expired'

export interface RequirementFeature {
  name: string
  description?: string
}

export interface RequirementPayload {
  summary?: string
  features: RequirementFeature[]
  references: string[]
  tech_preferences: string[]
  deliverables: string[]
  deadline?: string | null
  notes?: string | null
}

export interface Order {
  id: number
  access_key: string
  xianyu_order_id: string | null
  client_name: string
  description: string | null
  status: OrderStatus
  project_type: string
  difficulty: string
  budget_range: string
  priority: string
  tags: string[]
  custom_tags: string[]
  requirements: RequirementPayload
  github_repo_url: string | null
  github_repo_name: string | null
  xianyu_account: string | null
  estimated_hours: number | null
  actual_hours: number | null
  price: number | null
  quoted_price: number | null
  ai_conversation_id: string | null
  ai_coding_task_id: string | null
  ai_cost: number | null
  expires_at: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  delivered_at: string | null
  accepted_at: string | null
  cancelled_at: string | null
}

export interface OrderListResponse {
  total: number
  items: Order[]
}

export interface TimelineEvent {
  id: number
  order_id: number
  event_type: string
  event_data: Record<string, unknown>
  actor: string
  created_at: string
}

export interface TimelineListResponse {
  total: number
  items: TimelineEvent[]
}

export interface OrderLog {
  id: number
  order_id: number
  ip_address: string
  user_agent: string
  action_type: string
  target_file: string | null
  timestamp: string
  createdAt?: string
  action?: string
  ip?: string
  userAgent?: string
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
  file_type: 'req' | 'source' | 'delivery' | 'screenshot' | 'log'
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

export interface NotificationItem {
  id: number
  order_id: number | null
  type: string
  title: string
  content: string
  channel: string
  is_read: boolean
  created_at: string
}

export interface NotificationListResponse {
  total: number
  unread: number
  items: NotificationItem[]
}

export interface DashboardMetrics {
  total_orders: number
  in_progress_orders: number
  completed_this_month: number
  monthly_revenue: number
  ai_cost_total: number
  estimated_profit: number
  status_distribution: Array<{ status: string; count: number }>
  revenue_trend: Array<{ date: string; revenue: number }>
}

export interface BatchActionResponse {
  success_count: number
  failed_ids: number[]
}

export interface XianyuAccount {
  id: number
  account_name: string
  status: string
  cookie_updated_at: string | null
  message_count: number
  linked_order_count: number
  risk_flag: boolean
  created_at: string
  updated_at: string
}

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

export interface OrderConvertRequest {
  access_key: string
  xianyu_order_id: string
  selected_file_ids: number[]
  delete_unselected?: boolean
  notes?: string
}

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
}

export const orderApi = {
  list: (params?: Record<string, unknown>) => api.get<OrderListResponse>('/orders/', { params }),
  create: (data: Partial<Order>) => api.post<Order>('/orders/', data),
  get: (id: number) => api.get<Order>(`/orders/${id}`),
  update: (id: number, data: Partial<Order>) => api.patch<Order>(`/orders/${id}`, data),
  delete: (id: number) => api.delete(`/orders/${id}`),
  updateStatus: (id: number, status: OrderStatus, note?: string) =>
    api.post<Order>(`/orders/${id}/status`, { status, note }),
  overrideStatus: (id: number, status: OrderStatus, reason: string) =>
    api.post<Order>(`/orders/${id}/status/override`, { status, reason }),
  getTimeline: (id: number, params?: { skip?: number; limit?: number }) =>
    api.get<TimelineListResponse>(`/orders/${id}/timeline`, { params }),
  appendTimeline: (id: number, data: Record<string, unknown>) =>
    api.post<TimelineEvent>(`/orders/${id}/timeline`, data),
  getFull: (id: number) => api.get(`/orders/${id}/full`),
  getLogs: (id: number, params?: { skip?: number; limit?: number }) =>
    api.get<OrderLogListResponse>(`/orders/${id}/logs`, { params }),
  getFiles: (id: number, includeUnselected?: boolean) =>
    api.get<FileListResponse>(`/orders/${id}/files`, { params: { include_unselected: includeUnselected ?? true } }),
  getByHash: (hash: string) => api.get<Order>(`/orders/by-hash/${hash}`),
  getFilesByHash: (hash: string, includeUnselected?: boolean) =>
    api.get<FileListResponse>(`/orders/by-hash/${hash}/files`, { params: { include_unselected: includeUnselected ?? true } }),
  convert: (data: OrderConvertRequest) => api.post<Order>('/orders/convert', data),
}

export const dashboardApi = {
  metrics: () => api.get<DashboardMetrics>('/dashboard/metrics'),
  batchAction: (action: 'approve' | 'deliver' | 'close_expired', orderIds: number[], note?: string) =>
    api.post<BatchActionResponse>('/dashboard/batch', { action, order_ids: orderIds, note }),
  listXianyuAccounts: () => api.get<XianyuAccount[]>('/dashboard/xianyu-accounts'),
  createXianyuAccount: (data: Partial<XianyuAccount>) => api.post<XianyuAccount>('/dashboard/xianyu-accounts', data),
  updateXianyuAccount: (id: number, data: Partial<XianyuAccount>) =>
    api.patch<XianyuAccount>(`/dashboard/xianyu-accounts/${id}`, data),
}

export const notificationApi = {
  list: (params?: { unread_only?: boolean; skip?: number; limit?: number }) =>
    api.get<NotificationListResponse>('/notifications/', { params }),
  read: (id: number) => api.patch<NotificationItem>(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
}

export const clientApi = {
  getInfo: (accessKey: string) => api.get<Order>(`/client/${accessKey}/info`),
  getFiles: (accessKey: string) => api.get<FileListResponse>(`/client/${accessKey}/files`),
  getTimeline: (accessKey: string) => api.get<TimelineListResponse>(`/client/${accessKey}/timeline`),
  confirmRequirements: (accessKey: string) => api.post(`/client/${accessKey}/requirements/confirm`),
  submitRequirementFeedback: (accessKey: string, content: string) =>
    api.post(`/client/${accessKey}/requirements/feedback`, { content }),
  getConversationSummary: (accessKey: string) =>
    api.get<{ summary: string; highlights: string[] }>(`/client/${accessKey}/conversation-summary`),
  getOSSStatus: (accessKey: string) => api.get<OSSStatus>(`/client/${accessKey}/oss-status`),
  checkFileHash: (accessKey: string, fileHash: string) =>
    api.post<FileHashCheckResponse>(`/client/${accessKey}/check-hash`, { file_hash: fileHash, access_key: accessKey }),
  getOSSSignature: (accessKey: string, fileHash: string, filename: string, contentType?: string) =>
    api.get<OSSSignature>(`/client/${accessKey}/oss-signature`, {
      params: { file_hash: fileHash, filename, content_type: contentType || 'application/octet-stream' },
    }),
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
  upload: (accessKey: string, fileType: FileItem['file_type'], file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<FileItem>('/files/upload', formData, {
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
  download: (fileId: number, accessKey?: string) => {
    const url = accessKey
      ? `/api/v1/files/download/${fileId}?access_key=${accessKey}`
      : `/api/v1/files/download/${fileId}`
    window.location.href = url
  },
  delete: (fileId: number) => api.delete(`/files/${fileId}`),
}

export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function uploadToOSS(
  signature: OSSSignature,
  file: File,
  _fileHash: string,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  const formData = new FormData()
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
  } catch {
    return false
  }
}

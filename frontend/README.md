# Order Platform Frontend (Phase 1)

React + TypeScript + Vite 管理端/客户端前端。

## 页面
- `/`：订单查询入口
- `/admin`：订单管理、看板、批量操作、闲鱼账号管理
- `/admin/notifications`：通知中心
- `/order/:hash`：客户可视化页面（时间线、需求确认、反馈、交付预览）

## 启动
```bash
cd frontend
pnpm install
pnpm dev
```

## 构建
```bash
pnpm build
```

## API 依赖
- 默认请求前缀：`/api/v1`
- 管理端走 JWT（`Authorization: Bearer ...`）
- 客户端走 `access_key` 路径参数

## 一期能力
- 管理端订单筛选、状态推进、强制跳转、时间线查看
- 看板统计、批量操作、闲鱼账号管理
- 通知中心（读未读管理）
- 客户端时间线、需求确认/反馈、沟通摘要、交付预览与下载

# 闲鱼自动化接单平台 - 项目开发大纲

> 终极目标：AI 全自动接单、收集需求、写代码、测试、交付，实现被动收入

---

## 一、整体架构概览

整个系统由四个核心模块组成，彼此独立部署，通过 HTTP API 和 Webhook 事件驱动串联。

### 1. 订单管理平台（order-platform）

当前项目的升级版，负责订单的全生命周期管理和客户可视化展示。是整个系统的数据中枢，所有其他模块都依赖它的 API。

### 2. 闲鱼消息网关（xianyu-gateway）

基于开源项目 XianyuAutoAgent 的思路开发，负责多个闲鱼账号的消息接入和转发。它不直接处理业务逻辑，只做消息的收发和路由。

### 3. OpenClaw AI 技能（openclaw-skill）

运行在 OpenClaw 平台上的自定义 Skill，负责需求收集、编码调度和交付管理三大核心流程。OpenClaw 作为 AI Agent 的运行时环境，提供工具调用、持久记忆和多渠道通信能力。

### 4. 代码工厂（code-factory）

调用 OpenAI Codex API 实现自动编码、测试和截图。每个订单对应一个独立的 GitHub 仓库，由 AI 自动创建和维护。

---

## 二、GitHub 组织与仓库结构

在 GitHub 上创建一个组织，所有代码和订单项目统一管理。

### 基础设施仓库（固定）

- `order-platform` — 订单管理平台的前后端代码，就是当前这个项目演进而来
- `xianyu-gateway` — 闲鱼消息接入层，负责 WebSocket 长连接和多账号管理
- `openclaw-skill` — OpenClaw 的 Skill 定义文件，包含需求收集、编码调度、交付管理的提示词和配置
- `code-factory` — AI 自动编码的服务端，封装 Codex API 调用、沙箱运行、截图生成等能力

### 订单仓库（动态创建）

每当一个新订单确认后，系统会自动在该组织下创建一个对应的仓库，命名格式为 `order-{订单ID}-{简短描述}`，例如：

- `order-001-personal-blog` — 某客户的个人博客项目
- `order-002-data-crawler` — 某客户的数据爬虫项目
- `order-003-wechat-miniapp` — 某客户的微信小程序项目

这些仓库由 Codex 自动写入代码、提交 commit、运行测试。你只需要在管理后台看到通知后做最终 review。

---

## 三、第一期：订单管理平台升级

这是优先级最高的工作，是所有其他模块运转的基础。没有可靠的订单平台，后续的自动化都无从谈起。

### 3.1 订单数据模型扩展

当前的 Order 模型只有 `client_name`、`description`、`status`、`access_key`、`xianyu_order_id`、`expires_at` 这几个基础字段。对于一个完善的订单管理系统来说，信息维度远远不够。需要扩展以下字段：

#### 技术标签（tags）

存储为 JSON 数组，允许多选。标签体系分为几个大类：

**编程语言标签：**
- Python、TypeScript、JavaScript、Java、Go、Rust、C/C++、C#、PHP、Ruby、Swift、Kotlin

**前端框架标签：**
- React、Vue、Angular、Next.js、Nuxt.js、Svelte、Astro、Tailwind CSS

**后端框架标签：**
- FastAPI、Django、Flask、Express、NestJS、Spring Boot、Gin、Echo

**数据库标签：**
- MySQL、PostgreSQL、SQLite、MongoDB、Redis、Elasticsearch

**其他技术标签：**
- Docker、Kubernetes、AWS、阿里云、腾讯云、微信小程序、支付宝小程序、爬虫、自动化、数据分析、机器学习

#### 项目类型（project_type）

单选字段，明确这个项目属于哪一类：

- `website` — 网站/Web 应用
- `miniapp` — 小程序（微信/支付宝等）
- `script` — 脚本/工具
- `crawler` — 爬虫/数据采集
- `data_analysis` — 数据分析/可视化
- `automation` — 自动化工具/Bot
- `api_service` — API/后端服务
- `mobile_app` — 移动端应用
- `desktop_app` — 桌面端应用
- `other` — 其他

#### 难度等级（difficulty）

用于预估工时和定价参考：

- `trivial` — 极简，几小时内可完成，纯模板套用
- `easy` — 简单，1-2 天，有少量定制逻辑
- `medium` — 中等，3-5 天，有一定复杂度
- `hard` — 困难，1-2 周，涉及多个子系统
- `complex` — 复杂，2 周以上，架构设计要求高

#### 预算区间（budget_range）

- `budget` — 低预算（100 元以下）
- `standard` — 标准（100-500 元）
- `premium` — 高端（500-2000 元）
- `enterprise` — 企业级/定制（2000 元以上）

#### 关联字段

- `github_repo_url` — 该订单对应的 GitHub 仓库完整 URL
- `github_repo_name` — 仓库名称（组织内的短名）
- `xianyu_account` — 该订单来源于哪个闲鱼账号（支持多闲鱼号管理）
- `estimated_hours` — 预估工时（小时），可由 AI 自动评估或手动填写
- `actual_hours` — 实际工时
- `price` — 成交价格（元）
- `priority` — 优先级：`urgent` / `high` / `normal` / `low`

#### 结构化需求（requirements）

存储为 JSON 对象，替代纯文本的 description。结构如下：

- `summary` — 一句话概述
- `features` — 功能列表（数组），每个功能有名称和描述
- `references` — 参考链接/竞品（数组）
- `tech_preferences` — 客户指定的技术偏好
- `deliverables` — 期望的交付物清单
- `deadline` — 客户期望的截止日期
- `notes` — 其他备注

#### AI 相关字段

- `ai_conversation_id` — OpenClaw 上的对话 Session ID，用于关联需求收集的完整对话
- `ai_coding_task_id` — Codex 编码任务 ID
- `ai_cost` — 本订单消耗的 AI API 费用（美元）

### 3.2 订单状态流转升级

当前只有 5 个粗粒度状态（temp/pending/dev/delivered/expired），需要细化为能反映全自动化流程每一步的状态：

| 状态 | 含义 | 触发条件 |
|---|---|---|
| `draft` | 草稿 | 闲鱼消息网关检测到新客户咨询，自动创建 |
| `collecting` | 需求收集中 | AI Agent 正在跟客户对话收集需求 |
| `collected` | 需求已收集 | AI 判断需求信息已足够完整 |
| `quoted` | 已报价 | AI 根据需求自动报价，等待客户确认 |
| `confirmed` | 已确认 | 客户同意报价，订单正式成立 |
| `repo_created` | 仓库已创建 | GitHub 代码仓库已自动创建 |
| `coding` | 编码中 | Codex 正在自动生成代码 |
| `testing` | 测试中 | 自动化测试正在运行 |
| `code_review` | 待审核 | 编码完成，等待你做最终 review |
| `revision` | 修改中 | review 后发现问题，AI 正在修复 |
| `ready` | 待发货 | 代码审核通过，交付物已准备好 |
| `delivered` | 已发货 | 交付物已推送给客户 |
| `accepted` | 客户已确认 | 客户在闲鱼确认收货 |
| `disputed` | 争议中 | 客户提出异议，需要人工介入 |
| `cancelled` | 已取消 | 订单被取消 |
| `expired` | 已过期 | 超时未完成或未确认 |

状态流转规则需要在后端严格校验，防止非法跳转。同时每次状态变更都记录到时间线日志中。

### 3.3 时间线系统（Timeline）

新增一个 OrderTimeline 模型，记录订单生命周期中的每一个关键事件：

- `order_id` — 关联的订单 ID
- `event_type` — 事件类型（status_change / message / file_upload / screenshot / note / ai_action）
- `event_data` — 事件详情（JSON）
- `actor` — 操作者（admin / ai_agent / customer / system）
- `created_at` — 事件时间

这样客户在可视化页面就能看到完整的进度时间轴，管理员也能追溯订单的每一步操作。

### 3.4 Webhook 与外部接口

为闲鱼网关、OpenClaw、Codex 等外部模块提供事件驱动的接口：

#### 接收外部事件的 Webhook 端点

- `POST /api/v1/webhook/xianyu-message` — 接收闲鱼网关转发的客户消息
- `POST /api/v1/webhook/agent-update` — 接收 OpenClaw Agent 的状态更新（需求收集完成、报价完成等）
- `POST /api/v1/webhook/codex-result` — 接收 Codex 编码完成的结果（测试通过/失败、生成的文件列表等）
- `POST /api/v1/webhook/codex-progress` — 接收 Codex 编码的实时进度

#### Agent 调用的管理接口

- `POST /api/v1/agent/orders` — Agent 自动创建订单
- `PATCH /api/v1/agent/orders/{id}` — Agent 更新订单信息（补充需求、更新状态等）
- `POST /api/v1/agent/orders/{id}/files` — Agent 上传文件（需求文档、截图、交付物）
- `POST /api/v1/agent/orders/{id}/timeline` — Agent 写入时间线事件
- `GET /api/v1/agent/orders/{id}/full` — Agent 获取订单完整信息（含文件、时间线）

这些接口需要独立的 API Key 鉴权机制，区别于管理员和客户的认证方式。

### 3.5 客户可视化页面升级

当前客户端只有基础的文件上传和下载功能，需要大幅升级：

#### 进度时间线

- 展示完整的订单进度时间轴，从"需求收集中"到"已交付"的每一步
- 每个节点有时间戳、状态说明、可展开的详情
- 当前步骤高亮显示，已完成的步骤打勾
- 如果有 AI 生成的截图，在对应节点直接预览

#### 交付物展示

- 文件列表支持预览（图片直接显示、PDF 在线查看、代码文件语法高亮）
- 如果交付的是网站/Web 应用，提供在线演示的 iframe 预览
- AI 生成的效果截图形成对比展示（需求截图 vs 实际效果）
- 下载区域支持一键下载所有交付物（打包为 ZIP）

#### 需求确认流程

- 客户可以在页面上查看 AI 整理好的需求文档
- 如果需求有误，可以在线标注修改
- 报价确认按钮，客户点击后订单状态自动流转

#### 沟通记录

- 展示 AI 和客户在闲鱼上的对话摘要（脱敏后）
- 对话中提到的关键需求点自动标注高亮

### 3.6 管理后台升级

#### 数据看板

- 总订单数、进行中订单数、本月完成数、本月收入
- 各状态的订单分布饼图
- 按日/周/月的收入趋势折线图
- AI API 费用统计和利润率计算

#### 多维筛选与搜索

- 按技术标签筛选（如筛选所有包含 Python 标签的订单）
- 按项目类型筛选
- 按状态筛选
- 按来源闲鱼账号筛选
- 按时间范围筛选
- 全文搜索（搜索客户名、描述、需求内容）

#### 批量操作

- 批量审核通过
- 批量发货
- 批量关闭过期订单

#### 闲鱼账号管理

- 管理多个闲鱼号的 Cookie
- 显示每个账号的在线状态、消息量、关联订单数
- Cookie 过期提醒和一键刷新入口

#### 通知中心

- 新订单提醒
- AI 编码完成等待 review 提醒
- 客户消息提醒
- Cookie 过期/风控告警
- 支持浏览器推送和 Telegram/微信通知

---

## 四、第二期：闲鱼消息网关

### 4.1 技术基础

XianyuAutoAgent 项目（GitHub 5k star）已经验证了通过 Cookie 接入闲鱼 WebSocket 消息系统的可行性。核心原理：

- 通过浏览器抓取闲鱼网页端的 Cookie
- 使用 Cookie 建立 WebSocket 长连接
- 监听所有会话的新消息事件
- 通过闲鱼的内部 API 发送回复消息

我们的闲鱼网关在此基础上需要做以下改造和增强。

### 4.2 多账号管理

- 支持同时配置多个闲鱼账号
- 每个账号独立维护 WebSocket 连接
- 账号之间的消息隔离，互不干扰
- 某个账号掉线不影响其他账号
- 统一的账号健康状态监控面板

### 4.3 消息路由与队列

- 接收到的每条消息先入 Redis 消息队列，保证不丢失
- 消息经过预处理（去重、过滤系统消息、识别是否新客户）
- 将有效消息通过 HTTP 推送给 OpenClaw Agent 处理
- Agent 的回复消息同样经过队列，再通过闲鱼 API 发回

### 4.4 风控与安全

- 检测闲鱼平台的风控信号（如频繁发送相同内容被拦截）
- 模拟人工打字延迟，降低被检测概率
- 触发风控时自动暂停该账号的 AI 回复，发送告警通知
- 定期检查 Cookie 有效性，过期前提前提醒

### 4.5 人工接管机制

- 管理员可通过管理后台对某个会话启用"人工接管"模式
- 接管后 AI 不再自动回复该会话，由管理员手动回复
- 管理员回复后可选择切回 AI 模式
- 完整保留接管期间的对话记录，供 AI 后续参考上下文

### 4.6 对话历史存储

- 所有闲鱼对话完整存储到数据库
- 按会话（conversation）组织，包含所有消息
- 记录消息方向（收到/发出）、消息类型（文本/图片/链接/卡片）、时间戳
- 关联到订单，便于后续追溯

---

## 五、第三期：OpenClaw AI 技能

### 5.1 为什么选择 OpenClaw

OpenClaw 是一个开源的个人 AI 助手平台（GitHub 185k star），它提供了我们需要的关键能力：

- **Skill 系统**：通过 SKILL.md 文件定义 Agent 的行为模式，无需写代码即可扩展能力
- **工具调用**：Agent 可以执行 bash 命令、操作浏览器、读写文件、调用 API
- **持久记忆**：跨会话的上下文记忆，记住每个客户的偏好和历史
- **多渠道**：通过 Telegram/Discord/WhatsApp/WebChat 与 Agent 交互
- **7x24 运行**：Gateway 常驻后台运行，随时响应

### 5.2 Skill 文件格式

OpenClaw 的 Skill 本质是一个 SKILL.md 文件，包含 YAML frontmatter 和 Markdown 格式的指令。Agent 加载 Skill 后就知道在什么场景下应该做什么。

我们需要编写三个核心 Skill。

### 5.3 需求收集 Skill（xianyu-intake）

这是最关键的 Skill，处理从"客户发消息"到"需求确认"的全过程。

#### 触发条件

闲鱼网关通过 Webhook 将客户消息推送到 OpenClaw Agent。

#### 对话流程

第一轮：判断客户意图
- 如果客户只是随便聊聊/咨询，正常友好回复
- 如果客户有明确的项目需求，进入需求收集流程

第二轮：引导收集核心信息
- 项目是什么类型的（网站/脚本/爬虫/小程序等）
- 需要实现哪些核心功能
- 有没有参考案例或竞品
- 有没有特别的技术要求
- 期望的交付时间
- 预算大概多少

第三轮：补充细节
- 如果信息不够，继续追问关键缺失点
- 如果客户发了截图或文档，提取其中的需求信息
- 如果客户表述模糊，给出几个选项让客户选择

第四轮：确认与报价
- 整理所有收集到的信息，生成一份结构化的需求摘要
- 回发给客户确认是否准确
- 根据项目复杂度自动报价
- 客户确认后，调用订单平台 API 创建正式订单

#### 与订单平台的交互

- 在对话开始时就通过 API 创建一个 draft 状态的订单
- 对话过程中持续更新订单的需求字段
- 客户确认后更新订单状态为 confirmed
- 将对话摘要和收集到的文件一并上传到订单平台

### 5.4 编码调度 Skill（code-dispatcher）

需求确认后，负责自动驱动代码生成的全流程。

#### 仓库初始化

- 通过 GitHub API 在组织下创建订单仓库
- 根据项目类型选择对应的模板初始化仓库（React 模板、FastAPI 模板、爬虫模板等）
- 生成 README.md 写入需求摘要
- 将仓库 URL 回写到订单平台

#### 编码任务拆解

- 将需求文档拆解为具体的编码任务列表
- 为每个任务标注依赖关系和优先级
- 将任务列表作为 GitHub Issues 创建到仓库中

#### 调用 Codex 编码

- 将需求文档和任务列表发送给 Codex API
- Codex 在沙箱环境中生成代码
- 每完成一个任务，自动 commit 到仓库
- 实时将进度更新到订单平台的时间线中

#### 测试与验证

- 生成单元测试和集成测试
- 在沙箱环境中运行测试
- 如果测试失败，自动让 Codex 修复
- 如果是 Web 项目，在沙箱中启动服务并截图

#### 截图上传

- 使用浏览器工具截取运行效果图
- 将截图上传到订单平台
- 在时间线中添加"编码完成"事件

### 5.5 交付管理 Skill（delivery-manager）

代码通过你的 review 后，负责交付给客户。

#### 打包

- 将代码仓库打包为 ZIP 文件（排除 .git、node_modules 等）
- 如果需要构建（如 React 项目），先运行 build 再打包 dist 目录
- 生成项目交付文档（功能说明、技术栈、部署指南、目录结构说明）

#### 上传到订单平台

- 将打包好的交付物上传到 OSS
- 在订单文件列表中关联交付物
- 上传效果截图
- 更新订单状态为 delivered

#### 通知客户

- 通过闲鱼消息网关发送通知："您的项目已完成，请访问 [链接] 查看和下载"
- 提醒客户确认收货

### 5.6 OpenClaw 部署方案

- 需要一台 7x24 运行的机器，可以是 Mac Mini、VPS、或者云服务器
- 安装 Node.js 22+ 和 OpenClaw
- 配置 Anthropic Claude 或 OpenAI GPT 的 API Key 作为底层模型
- 将三个 Skill 放入 workspace/skills 目录
- 通过 Telegram 或 Discord 与 Agent 交互（用于监控和手动干预）
- 通过 Tailscale 或 SSH 隧道安全暴露 Gateway

---

## 六、第四期：代码工厂（Codex 自动编码）

### 6.1 为什么选 Codex

OpenAI Codex 的优势在于：
- 价格低，适合批量编码任务
- 代码生成质量相对稳定
- 可以在沙箱环境中执行代码和测试
- API 调用方式简单，易于集成

### 6.2 编码流程详述

#### 输入

- 结构化需求文档（JSON 格式，包含功能列表、技术栈、参考链接）
- 项目模板仓库 URL
- GitHub 仓库的写入权限 Token

#### 执行步骤

1. 接收编码任务后，先分析需求文档
2. 确定项目骨架（目录结构、入口文件、配置文件）
3. 按照功能列表逐个生成代码文件
4. 生成对应的测试文件
5. 运行所有测试
6. 如果测试失败，分析错误原因并修复（最多重试 3 次）
7. 运行 Lint 检查，修复代码风格问题
8. 如果是 Web 项目，启动开发服务器并用 Puppeteer 截图
9. 生成 README.md（包含项目说明、安装步骤、使用说明）
10. 将所有代码提交到 GitHub 仓库
11. 将结果（成功/失败、文件列表、截图、测试覆盖率）回调给订单平台

#### 输出

- GitHub 仓库中的完整代码
- 测试运行结果
- 效果截图（如适用）
- 项目文档（README + 部署指南）

### 6.3 项目类型模板

为不同类型的项目预设初始化模板，加速 Codex 的生成质量：

- **静态网站** — HTML + CSS + JavaScript，直接打开即可运行
- **React Web 应用** — Vite + React + TypeScript + Tailwind CSS
- **Vue Web 应用** — Vite + Vue 3 + TypeScript
- **Next.js 全栈应用** — Next.js + API Routes + Prisma
- **Python 脚本** — 标准 Python 项目结构，requirements.txt，入口脚本
- **Python 爬虫** — Scrapy 或 requests + BeautifulSoup 模板
- **FastAPI 后端** — FastAPI + SQLAlchemy + Pydantic
- **数据分析** — Jupyter Notebook + Pandas + Matplotlib
- **微信小程序** — 原生小程序或 uni-app 模板
- **自动化工具** — Python + 定时任务 + 日志

### 6.4 沙箱环境

Codex 的代码运行必须在隔离的沙箱中进行，防止安全问题：

- 使用 Docker 容器作为沙箱
- 每个编码任务创建一个独立的容器
- 容器中预装常用的开发环境（Node.js、Python、Go 等）
- 限制网络访问（只允许 npm install / pip install 等包管理器的出站流量）
- 限制 CPU/内存资源
- 任务完成后自动销毁容器

### 6.5 质量保障

- 运行项目自带的测试套件
- 代码风格检查（ESLint / Pylint / Prettier）
- 如果是 Web 项目，检查页面是否能正常加载
- 如果是 API 项目，检查端点是否能正常响应
- 生成代码质量报告附在交付文档中
- 所有生成的代码在 GitHub 上有完整的 commit 历史，便于 review

---

## 七、模块间数据流（全链路）

以下是一个完整订单从头到尾的数据流转过程：

### 阶段一：客户咨询

1. 客户在闲鱼上发送消息咨询
2. 闲鱼网关的 WebSocket 连接接收到消息
3. 网关将消息投入 Redis 消息队列
4. 网关调用订单平台 API 创建 draft 状态的订单
5. 网关将消息通过 HTTP 推送给 OpenClaw Agent

### 阶段二：需求收集

6. OpenClaw Agent 加载"需求收集 Skill"
7. Agent 生成引导性回复，经由网关发回给客户
8. 客户继续发送消息（需求描述、截图、文件）
9. Agent 通过多轮对话收集完整需求
10. Agent 将结构化需求更新到订单平台
11. Agent 自动报价，发送给客户确认

### 阶段三：订单确认

12. 客户确认报价
13. Agent 更新订单状态为 confirmed
14. Agent 在订单时间线中记录"订单已确认"事件
15. 触发编码流程

### 阶段四：自动编码

16. Agent 加载"编码调度 Skill"
17. Agent 通过 GitHub API 创建订单仓库
18. Agent 将仓库地址写入订单平台
19. Agent 调用 Codex API 开始编码
20. Codex 在沙箱中逐步生成代码
21. 每完成一个里程碑，通过 Webhook 更新订单平台的时间线
22. 编码完成后运行测试
23. 测试通过后截取效果图
24. 更新订单状态为 code_review

### 阶段五：人工审核

25. 你收到通知（Telegram/浏览器推送/管理后台）
26. 在 GitHub 上 review 代码
27. 如果需要修改，在 GitHub 上提 Issue，Agent 调度 Codex 修复
28. review 通过后，在管理后台点击"审核通过"

### 阶段六：交付

29. Agent 加载"交付管理 Skill"
30. Agent 打包交付物，上传到 OSS
31. 在订单平台关联交付物文件
32. 更新订单状态为 delivered
33. 通过闲鱼消息通知客户查看交付物
34. 客户在可视化页面查看效果截图、下载文件

### 阶段七：收尾

35. 客户在闲鱼确认收货
36. 闲鱼网关检测到确认收货事件
37. 更新订单状态为 accepted
38. 订单完成，利润入账

---

## 八、技术栈总览

| 模块 | 后端 | 前端 | 运行时 | 存储 |
|---|---|---|---|---|
| 订单管理平台 | FastAPI + SQLAlchemy | React + TypeScript + Vite + Tailwind | Python 3.11+ | SQLite（初期）/ PostgreSQL（后期） |
| 闲鱼消息网关 | Python + asyncio + WebSocket | — | Python 3.11+ | Redis（消息队列） + SQLite（对话历史） |
| OpenClaw Agent | — | — | Node.js 22+ | OpenClaw 内建存储 |
| 代码工厂 | Python / TypeScript | — | Docker 沙箱 | GitHub（代码） + OSS（交付物） |

基础设施：
- Docker Compose 统一编排所有服务
- Nginx 反向代理和 HTTPS
- 阿里云 OSS 或 MinIO 存储文件
- Redis 做消息队列和缓存
- GitHub API 管理代码仓库

---

## 九、开发排期建议

### 第一期：订单平台升级（预计 2-3 周）

- Phase 1（3-5 天）：订单模型扩展 + 数据库迁移 + 标签系统 + 状态流转
- Phase 2（2-3 天）：时间线系统 + Webhook/Agent API 接口
- Phase 3（5-7 天）：管理后台升级（看板、筛选、账号管理）
- Phase 4（3-5 天）：客户可视化页面升级（时间线、截图预览、需求确认）

### 第二期：闲鱼消息网关（预计 1-2 周）

- Phase 1（3-4 天）：单账号消息收发 + 核心 WebSocket 连接
- Phase 2（2-3 天）：多账号管理 + 消息队列 + 风控检测
- Phase 3（2-3 天）：人工接管 + 对话历史 + 管理接口

### 第三期：OpenClaw 技能开发（预计 2-3 周）

- Phase 1（2-3 天）：OpenClaw 环境搭建 + 基础配置
- Phase 2（5-7 天）：需求收集 Skill 开发 + 与订单平台联调
- Phase 3（3-5 天）：编码调度 Skill 开发
- Phase 4（2-3 天）：交付管理 Skill 开发

### 第四期：代码工厂（预计 2-3 周）

- Phase 1（3-5 天）：Codex API 接入 + 基础编码流程
- Phase 2（3-5 天）：Docker 沙箱 + 测试运行 + 截图生成
- Phase 3（3-4 天）：项目模板库 + 质量检查
- Phase 4（2-3 天）：与 OpenClaw 和订单平台的全链路集成

### 联调与收尾（预计 1-2 周）

- 全链路端到端测试
- 边界情况和异常处理
- 性能优化和安全加固
- 文档编写

---

## 十、风险与应对

### 闲鱼平台风险

- 风险：Cookie 方式接入属于非官方渠道，可能被风控或封号
- 应对：模拟人工行为（打字延迟、随机停顿）；多账号分散风险；触发风控时自动暂停并告警；定期更换 Cookie

### Cookie 维护成本

- 风险：Cookie 有过期时间，需要定期手动登录刷新
- 应对：Cookie 过期检测 + 提前告警；探索是否有自动刷新方案；最坏情况下保持每周手动刷新一次的习惯

### AI 生成质量

- 风险：Codex 生成的代码可能有 Bug、逻辑错误、安全漏洞
- 应对：人工 review 环节不可省略；自动化测试覆盖；对于复杂项目降级为半自动模式（AI 生成骨架，你补充核心逻辑）

### API 成本控制

- 风险：大量 AI API 调用可能导致成本过高，吃掉利润
- 应对：精确统计每个订单的 AI 消耗费用；在报价中考虑 AI 成本；设置每个订单的 API 调用上限；选择性价比高的模型

### 合规与法律

- 风险：闲鱼自动化可能违反平台服务协议
- 应对：控制自动化的程度，避免高频率操作；保持人工参与的比例；对外不宣传"全自动"

### 客户预期管理

- 风险：AI 生成的代码质量可能达不到客户预期
- 应对：报价时明确交付标准；对简单项目优先使用全自动模式，复杂项目保持人工深度参与；建立完善的修改和售后流程

---

## 十一、未来演进方向

### 多平台扩展

- 接入淘宝、拼多多等其他电商平台的代做服务
- 接入微信（通过 WeChat Bot 或企业微信）
- 独立官网接单入口

### 团队化运营

- 支持多个开发者/AI Agent 协同处理订单
- 订单自动分配（按技术栈匹配最擅长的 Agent）
- 多人 code review 流程

### 智能定价引擎

- 基于历史订单数据训练定价模型
- 考虑市场竞品价格、需求复杂度、客户预算等因素
- 动态调整报价策略（忙时提价、闲时降价）

### 售后与迭代

- AI 自动处理客户的修改需求和 Bug 反馈
- 建立客户满意度评价体系
- 回头客优惠和自动推荐

### 商业智能

- 客户画像分析
- 需求趋势预测（哪类项目最近需求量大）
- 收入预测和成本优化建议
- 竞品动态监控

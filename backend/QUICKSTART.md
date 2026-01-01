# 🚀 快速启动指南

## 第一步：安装依赖

进入backend目录并安装所需的Python包：

```bash
cd backend
pip install -r requirements.txt
```

## 第二步：配置环境变量

编辑 `.env` 文件，修改以下配置：

```env
# 修改为安全的密钥（生产环境必须修改）
SECRET_KEY=your-super-secret-key-change-this

# 上传目录已配置为绝对路径
UPLOAD_DIR=/Users/Eric/Documents/Xianyu-OrderVisualization/backend/upload_storage
```

**生成安全的SECRET_KEY：**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 第三步：创建管理员账户

运行创建管理员脚本：

```bash
python create_admin.py
```

按提示输入用户名和密码（默认：admin / admin123）

## 第四步：启动服务器

```bash
python main.py
```

服务器将运行在：http://localhost:8000

## 第五步：测试API

### 访问API文档
打开浏览器访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 测试登录
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

返回JWT token后，就可以使用API了！

## Docker部署（可选）

如果想使用Docker：

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 下一步

✅ 后端已完成！你现在可以：
1. 测试所有API端点
2. 创建订单并生成access_key
3. 上传文件
4. 查看访问日志

准备好开发前端了吗？参考todolist中的前端开发任务！

## 故障排除

### 问题：导入错误
**解决**：确保已安装所有依赖：`pip install -r requirements.txt`

### 问题：数据库文件不存在
**解决**：首次启动时会自动创建，确保有写入权限

### 问题：端口被占用
**解决**：编辑 main.py 修改端口号

### 问题：CORS错误
**解决**：在`.env`中添加前端URL到CORS_ORIGINS

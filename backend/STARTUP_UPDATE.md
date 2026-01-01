
## 🚀 快速启动

```bash
# 1. 进入项目目录
cd backend

# 2. 安装依赖（首次运行）
pip install -r requirements.txt

# 3. 创建管理员（首次运行）
python create_admin.py

# 4. 启动服务器
python main.py
```

启动后会看到：
```
🚀 Starting Xianyu Order API...
📝 API Docs: http://localhost:8000/docs
❤️  Health Check: http://localhost:8000/health

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
🚀 Starting up application...
✅ Upload directory ready: /path/to/upload_storage
✅ Database initialized
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## ⚙️ 配置选项

如需修改配置，编辑 `main.py` 文件：

```python
uvicorn.run(
    "app.main:app",
    host="0.0.0.0",      # 监听地址（0.0.0.0 = 所有网卡）
    port=8000,           # 端口号
    reload=True,         # 热重载（开发模式）
    log_level="info"     # 日志级别: debug/info/warning/error
)
```

### 常见修改：

**修改端口**（避免冲突）：
```python
port=8001,
```

**生产环境**（关闭热重载）：
```python
reload=False,
```

**调试模式**（查看详细日志）：
```python
log_level="debug"
```

---

## 📝 所有文档已更新

以下文档的启动命令都已更新：
- ✅ QUICKSTART.md
- ✅ README.md
- ✅ COMPLETION_SUMMARY.md
- ✅ check_health.py

所有地方现在都使用 `python main.py` ！

---

## 🎯 测试启动

运行以下命令测试：

```bash
cd backend
python main.py
```

然后访问：http://localhost:8000/docs

看到 Swagger UI 就说明成功了！

按 `Ctrl+C` 停止服务器。

---

**享受更简单的开发体验！** ✨

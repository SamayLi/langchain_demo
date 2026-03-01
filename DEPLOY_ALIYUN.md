# 阿里云部署指南

本指南将帮助您使用 Docker 和 Docker Compose 将 LangChain 对话式 Web 应用部署到阿里云 ECS 服务器。

## 1. 准备工作

### 1.1 购买 ECS 服务器
1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)。
2. 购买一台 ECS 实例：
   - **操作系统**: 推荐选择 `Ubuntu 22.04` 或 `Alibaba Cloud Linux 3`。
   - **配置**: 建议至少 `2核 4G`（因为需要运行 Docker 和 LLM 相关逻辑）。
   - **带宽**: 按需选择，建议至少 3M 以保证加载速度。

### 1.2 配置安全组
在 ECS 实例的安全组规则中，开放以下端口：
- **80** (HTTP): 用于访问前端网页。
- **22** (SSH): 用于远程连接服务器。
- **8000** (可选): 如果你想直接访问后端 API 进行调试。

## 2. 服务器环境安装

使用 SSH 连接到您的服务器，然后执行以下命令安装 Docker。

```bash
# 更新软件包
sudo apt-get update

# 安装 Docker
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
sudo docker --version
sudo docker compose version
```

## 3. 部署代码

### 3.1 上传代码
您可以选择使用 `git` 拉取代码（如果代码在 GitHub/GitLab 上），或者使用 `scp` 将本地代码上传到服务器。

**方法 A: 使用 Git (推荐)**
```bash
git clone <your-repo-url>
cd <your-project-folder>
```

**方法 B: 从本地上传**
在您本地电脑的终端执行：
```bash
# 假设服务器 IP 为 1.2.3.4
scp -r /path/to/your/project root@1.2.3.4:/root/langchain-app
```

### 3.2 配置环境变量
进入项目目录，确保 `api/.env` 文件存在且配置正确。

```bash
cd langchain-app/api
cp .env.example .env  # 如果没有 .env 文件
vim .env              # 编辑填入您的 API Key
```

确保填入以下关键信息：
```env
OPENAI_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...
SERPAPI_API_KEY=...
```

## 4. 启动服务

回到项目根目录，运行 Docker Compose：

```bash
cd .. # 回到根目录，即 docker-compose.yml 所在目录
sudo docker compose up -d --build
```

等待构建完成（第一次可能需要几分钟下载镜像）。

## 5. 验证部署

1. **查看运行状态**：
   ```bash
   sudo docker compose ps
   ```
   应该看到 `frontend` 和 `backend` 两个容器状态为 `Up`。

2. **访问应用**：
   打开浏览器，访问您的 ECS 公网 IP：`http://<ECS-公网-IP>`。
   
   - 您应该能看到应用界面。
   - 尝试上传文档或进行对话，验证功能是否正常。

## 常见问题排查

- **容器无法启动**：
  查看日志：
  ```bash
  sudo docker compose logs -f backend
  ```
- **前端无法访问后端**：
  检查 `nginx.conf` 中的 `proxy_pass` 是否正确指向了 `http://backend:8000`。
- **上传文件失败**：
  检查服务器磁盘空间，以及 `api/uploads` 目录的权限。Docker 会自动处理卷挂载权限，一般无需手动干预。

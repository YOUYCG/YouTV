# YouTV 部署指南

本文档详细介绍了 YouTV 的各种部署方式，包括 Docker、云平台和传统服务器部署。

## 📋 目录

- [环境要求](#环境要求)
- [Docker 部署](#docker-部署)
- [云平台部署](#云平台部署)
- [传统服务器部署](#传统服务器部署)
- [配置说明](#配置说明)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🔧 环境要求

### 最低要求
- **CPU**: 1 核心
- **内存**: 512MB RAM
- **存储**: 1GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 2 核心或更多
- **内存**: 1GB RAM 或更多
- **存储**: 2GB 可用空间
- **网络**: 高速互联网连接

### 软件要求
- **Docker**: 20.10+ （Docker 部署）
- **Node.js**: 18.0+ （传统部署）
- **Git**: 最新版本

## 🐳 Docker 部署

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/your-username/YouTV.git
cd YouTV
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件设置密码等配置
nano .env
```

3. **启动服务**
```bash
docker-compose up -d
```

4. **访问应用**
打开浏览器访问 `http://localhost:8080`

### 自定义配置

#### 修改端口
```yaml
# docker-compose.yml
services:
  youtv:
    ports:
      - "3000:8080"  # 将应用映射到主机的 3000 端口
```

#### 设置密码保护
```bash
# .env 文件
PASSWORD=your_secure_password
```

#### 启用调试模式
```bash
# .env 文件
DEBUG=true
```

### Docker 命令参考

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f youtv

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新应用
git pull
docker-compose build --no-cache
docker-compose up -d

# 清理未使用的镜像
docker system prune -f
```

## ☁️ 云平台部署

### Vercel 部署

1. **准备代码**
```bash
git clone https://github.com/your-username/YouTV.git
cd YouTV
git push origin main
```

2. **在 Vercel 中部署**
- 访问 [Vercel](https://vercel.com)
- 导入 GitHub 仓库
- 配置环境变量
- 部署

3. **环境变量配置**
```
PASSWORD=your_password
DEBUG=false
CORS_ORIGIN=https://your-domain.vercel.app
```

### Railway 部署

1. **连接仓库**
- 访问 [Railway](https://railway.app)
- 连接 GitHub 仓库
- 选择 YouTV 项目

2. **配置环境变量**
```
PORT=8080
PASSWORD=your_password
DEBUG=false
```

3. **自动部署**
Railway 会自动检测 Dockerfile 并部署应用。

### Heroku 部署

1. **安装 Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **部署应用**
```bash
heroku create your-app-name
heroku config:set PASSWORD=your_password
heroku config:set DEBUG=false
git push heroku main
```

### DigitalOcean App Platform

1. **创建应用**
- 访问 DigitalOcean App Platform
- 连接 GitHub 仓库
- 选择 YouTV 项目

2. **配置设置**
```yaml
# .do/app.yaml
name: youtv
services:
- name: web
  source_dir: /
  github:
    repo: your-username/YouTV
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: PASSWORD
    value: your_password
  - key: DEBUG
    value: "false"
```

## 🖥️ 传统服务器部署

### Ubuntu/Debian 服务器

1. **安装 Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **克隆和配置项目**
```bash
git clone https://github.com/your-username/YouTV.git
cd YouTV
npm install
cp .env.example .env
nano .env
```

3. **构建应用**
```bash
npm run build
```

4. **使用 PM2 管理进程**
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/server/app.js --name youtv

# 设置开机自启
pm2 startup
pm2 save
```

### CentOS/RHEL 服务器

1. **安装 Node.js**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. **其他步骤与 Ubuntu 相同**

### 使用 Nginx 反向代理

1. **安装 Nginx**
```bash
sudo apt-get install nginx
```

2. **配置 Nginx**
```nginx
# /etc/nginx/sites-available/youtv
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **启用配置**
```bash
sudo ln -s /etc/nginx/sites-available/youtv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL 证书配置

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 生产环境建议 |
|--------|------|--------|-------------|
| `PORT` | 服务器端口 | `8080` | `8080` |
| `PASSWORD` | 访问密码 | 无 | 设置强密码 |
| `DEBUG` | 调试模式 | `false` | `false` |
| `CORS_ORIGIN` | CORS源 | `*` | 具体域名 |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制 | `100` | `50-100` |

### 性能优化

1. **启用 Gzip 压缩**
```nginx
# Nginx 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

2. **设置缓存头**
```nginx
# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **调整 Node.js 内存限制**
```bash
# PM2 配置
pm2 start dist/server/app.js --name youtv --node-args="--max-old-space-size=512"
```

## 📊 监控和维护

### 日志管理

1. **查看应用日志**
```bash
# Docker
docker-compose logs -f youtv

# PM2
pm2 logs youtv

# 系统日志
sudo journalctl -u youtv -f
```

2. **日志轮转**
```bash
# 配置 logrotate
sudo nano /etc/logrotate.d/youtv
```

### 健康检查

1. **API 健康检查**
```bash
curl -f http://localhost:8080/api || echo "Service is down"
```

2. **自动监控脚本**
```bash
#!/bin/bash
# monitor.sh
while true; do
    if ! curl -f http://localhost:8080/api > /dev/null 2>&1; then
        echo "Service is down, restarting..."
        pm2 restart youtv
    fi
    sleep 60
done
```

### 备份策略

1. **配置文件备份**
```bash
# 备份配置
tar -czf youtv-config-$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

2. **自动备份脚本**
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/youtv"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/youtv-$DATE.tar.gz .env docker-compose.yml logs/

# 保留最近 7 天的备份
find $BACKUP_DIR -name "youtv-*.tar.gz" -mtime +7 -delete
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
sudo lsof -i :8080
# 或
sudo netstat -tulpn | grep :8080
```

2. **内存不足**
```bash
# 检查内存使用
free -h
# 检查进程内存使用
ps aux --sort=-%mem | head
```

3. **磁盘空间不足**
```bash
# 检查磁盘使用
df -h
# 清理 Docker 镜像
docker system prune -a
```

### 性能问题

1. **响应时间慢**
- 检查网络连接
- 增加服务器资源
- 优化 API 源配置

2. **内存泄漏**
- 重启应用
- 检查日志错误
- 更新到最新版本

### 获取帮助

如果遇到问题，可以：

1. 查看 [GitHub Issues](https://github.com/your-username/YouTV/issues)
2. 创建新的 Issue 报告问题
3. 参与 [Discussions](https://github.com/your-username/YouTV/discussions)
4. 发送邮件至 [your-email@example.com](mailto:your-email@example.com)

---

**注意**: 请确保遵守当地法律法规，仅将 YouTV 用于合法用途。

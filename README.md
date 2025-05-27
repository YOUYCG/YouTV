# YouTV - 开源视频聚合播放器

<div align="center">
  <img src="src/public/assets/logo.svg" alt="YouTV Logo" width="120" height="120">

  <h3>🎬 现代化的视频聚合播放平台</h3>

  <p>
    <a href="#特性">特性</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#部署">部署</a> •
    <a href="#配置">配置</a> •
    <a href="#贡献">贡献</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript">
    <img src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" alt="License">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </p>
</div>

## 📖 简介

YouTV 是一个现代化的开源视频聚合播放器，支持多个视频源的搜索、播放和管理。采用 TypeScript + Express + Vite 技术栈，提供流畅的用户体验和强大的功能。

## ✨ 特性

### 🎯 核心功能
- 🔍 **多源搜索**: 支持多个视频API源并行搜索，智能聚合结果
- 🎬 **流畅播放**: 基于HLS.js的高质量视频播放，支持多种格式
- 🔥 **热门推荐**: 智能推荐热门影视内容，发现精彩内容
- 📺 **剧集管理**: 完整的剧集列表和播放进度管理
- 🎭 **豆瓣集成**: 集成豆瓣电影推荐，获取高质量内容

### 🛠️ 技术特性
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🔒 **密码保护**: 可选的访问密码保护功能
- ⚙️ **自定义配置**: 支持自定义API源和个性化设置
- 📚 **搜索历史**: 智能搜索历史记录管理
- 🎨 **现代UI**: 基于Tailwind CSS的现代化界面设计
- 🚀 **高性能**: TypeScript + Express.js 后端，智能缓存优化
- 🔧 **健康检查**: 自动监控API源状态，确保服务可用性
- 🌐 **代理支持**: 内置代理服务，解决跨域和访问问题

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express.js** + **TypeScript**
- **Axios** - HTTP请求库
- **Helmet** - 安全中间件
- **CORS** - 跨域资源共享
- **Rate Limiting** - 请求频率限制

### 前端
- **HTML5** + **CSS3** + **Modern JavaScript**
- **Tailwind CSS** - 样式框架
- **HLS.js** - 视频流播放
- **Responsive Design** - 响应式设计

### 构建工具
- **Vite** - 前端构建工具
- **TypeScript** - 类型安全
- **PostCSS** + **Autoprefixer** - CSS处理

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn 或 pnpm
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/YouTV.git
cd YouTV
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置环境**
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置文件（可选）
nano .env
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
- 打开浏览器访问 `http://localhost:8080`
- 前端开发服务器: `http://localhost:3001`（如果需要）

## 📦 部署

### 🐳 Docker 部署（推荐）

```bash
# 构建镜像
docker build -t youtv .

# 运行容器
docker run -d \
  --name youtv \
  -p 8080:8080 \
  -e PASSWORD=your_password \
  -e DEBUG=false \
  youtv
```

### 🚀 生产部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### ☁️ 云平台部署

#### Vercel 部署
1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

#### Railway 部署
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

#### Heroku 部署
```bash
# 安装 Heroku CLI
heroku create your-app-name
heroku config:set PASSWORD=your_password
git push heroku main
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务器端口 | `8080` | ❌ |
| `PASSWORD` | 访问密码 | 无 | ❌ |
| `DEBUG` | 调试模式 | `false` | ❌ |
| `CORS_ORIGIN` | CORS源 | `*` | ❌ |
| `TIMEOUT` | 请求超时(ms) | `10000` | ❌ |
| `MAX_RETRIES` | 最大重试次数 | `3` | ❌ |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制最大请求数 | `100` | ❌ |
| `RATE_LIMIT_WINDOW_MS` | 速率限制时间窗口(ms) | `900000` | ❌ |

### 配置文件

主要配置文件位于 `src/server/utils/config.ts`：

```typescript
export const config = {
  port: parseInt(process.env.PORT || '8080'),
  password: process.env.PASSWORD || '',
  debug: process.env.DEBUG === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  timeout: parseInt(process.env.TIMEOUT || '10000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  // ... 更多配置
};
```

### API源配置

项目内置了多个视频API源，支持：
- 🔧 **内置API源管理** - 预配置多个可靠的视频源
- ➕ **自定义API源添加** - 支持添加自己的视频API
- 🔞 **成人内容过滤** - 可选的内容过滤功能
- 📊 **API源状态监控** - 自动检查源的健康状态
- ⚡ **智能负载均衡** - 优先使用健康的API源

## 🔧 API 文档

### 搜索接口

```http
GET /api/search?q=关键词&sources=源代码&page=页码
```

**参数说明:**
- `q`: 搜索关键词（必需）
- `sources`: API源代码，多个用逗号分隔（可选）
- `page`: 页码，默认为1（可选）

### 视频详情

```http
GET /api/detail?id=视频ID&source=源代码
```

**参数说明:**
- `id`: 视频ID（必需）
- `source`: API源代码（必需）

### 热门内容

```http
GET /api/trending?type=movie|tv&limit=12
```

**参数说明:**
- `type`: 内容类型，movie（电影）或tv（电视剧）（可选，默认movie）
- `limit`: 返回数量限制（可选，默认12）

### API源管理

```http
GET /api/sources
```

### 豆瓣推荐

```http
GET /api/douban?type=movie|tv&limit=6
```

### 代理服务

```http
GET /proxy/:encodedUrl
```

**说明:** 用于代理视频流和解决跨域问题

## 🎮 使用说明

### 🔍 搜索功能

1. **基础搜索**: 在搜索框输入关键词，支持电影、电视剧、综艺、动漫等
2. **多源搜索**: 系统会自动从多个API源搜索，聚合最佳结果
3. **搜索历史**: 自动保存搜索历史，方便快速重复搜索
4. **智能建议**: 根据搜索历史提供智能搜索建议

### 🏠 首页功能

1. **热门推荐**: 显示当前热门的电影和电视剧
2. **豆瓣热门**: 集成豆瓣高分推荐内容
3. **分类浏览**: 按电影、电视剧、动漫、综艺分类浏览
4. **一键切换**: 快速在不同内容类型间切换

### 🎬 播放功能

1. **高质量播放**: 支持HLS流媒体和多种视频格式
2. **剧集管理**: 完整的剧集列表，支持快速跳转
3. **播放记忆**: 自动记住播放进度
4. **自动连播**: 支持自动播放下一集

### ⚙️ 高级功能

1. **自定义API源**: 在设置中添加自己的视频API源
2. **API源管理**: 启用/禁用特定的API源
3. **内容过滤**: 可选的成人内容过滤功能
4. **密码保护**: 为应用设置访问密码
5. **配置导入导出**: 备份和恢复个人设置

### ⌨️ 键盘快捷键

#### 播放器快捷键
- `空格`: 播放/暂停
- `←/→`: 快退/快进 10秒
- `↑/↓`: 音量增减
- `M`: 静音切换
- `F`: 全屏切换
- `Escape`: 退出全屏或返回上一页

#### 导航快捷键
- `Escape`: 返回上一页（播放器页面）
- `Enter`: 确认搜索（搜索框中）

## 🏗️ 项目结构

```
YouTV/
├── src/
│   ├── server/              # 后端服务器
│   │   ├── routes/          # API路由
│   │   │   ├── index.ts     # 主路由
│   │   │   ├── search.ts    # 搜索接口
│   │   │   ├── detail.ts    # 视频详情
│   │   │   ├── trending.ts  # 热门内容
│   │   │   ├── douban.ts    # 豆瓣推荐
│   │   │   ├── sources.ts   # API源管理
│   │   │   └── proxy.ts     # 代理服务
│   │   ├── middleware/      # 中间件
│   │   │   └── proxy.ts     # 代理中间件
│   │   ├── utils/           # 工具函数
│   │   │   ├── config.ts    # 配置管理
│   │   │   ├── cache.ts     # 缓存管理
│   │   │   ├── validation.ts # 数据验证
│   │   │   ├── apiSources.ts # API源配置
│   │   │   ├── healthCheck.ts # 健康检查
│   │   │   └── crypto.ts    # 加密工具
│   │   └── app.ts           # 应用入口
│   ├── public/              # 前端静态文件
│   │   ├── css/             # 样式文件
│   │   │   └── main.css     # 主样式
│   │   ├── js/              # JavaScript文件
│   │   │   ├── app.js       # 主应用逻辑
│   │   │   └── player.js    # 播放器逻辑
│   │   ├── assets/          # 静态资源
│   │   │   ├── logo.svg     # Logo文件
│   │   │   └── favicon.svg  # 图标文件
│   │   ├── index.html       # 主页面
│   │   └── player.html      # 播放器页面
│   └── types/               # TypeScript类型定义
│       └── index.ts         # 类型声明
├── docker/                  # Docker配置
├── docs/                    # 项目文档
├── dist/                    # 构建输出目录
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind CSS配置
├── Dockerfile               # Docker构建文件
├── .env.example             # 环境变量示例
└── README.md                # 项目说明
```

## 🛠️ 开发指南

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint
```

### 添加新的API源

1. 在 `src/server/utils/apiSources.ts` 中添加新源配置：

```typescript
export const apiSources = [
  // ... 现有源
  {
    name: '新API源',
    code: 'new_api',
    api: 'https://api.example.com/',
    categories: ['movie', 'tv'],
    adult: false
  }
];
```

2. 实现对应的数据解析逻辑
3. 更新健康检查配置

### 自定义主题

修改 `src/public/css/main.css` 中的CSS变量：

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e293b;
  --accent-color: #06b6d4;
  --background-color: #0f172a;
  --text-color: #f8fafc;
  /* ... 更多变量 */
}
```

### 添加新功能

1. **后端API**: 在 `src/server/routes/` 中添加新路由
2. **前端功能**: 在 `src/public/js/` 中添加相应逻辑
3. **样式**: 在 `src/public/css/` 中添加样式
4. **类型定义**: 在 `src/types/` 中添加TypeScript类型

### 调试技巧

1. **启用调试模式**: 设置环境变量 `DEBUG=true`
2. **查看日志**: 检查控制台输出和网络请求
3. **API测试**: 使用 `/api` 端点直接测试API
4. **代理调试**: 检查 `/proxy` 端点的代理功能

## 🤝 贡献

我们欢迎所有形式的贡献！

### 贡献方式

1. **🐛 报告问题** - 在 [Issues](https://github.com/your-username/YouTV/issues) 中报告bug
2. **💡 功能建议** - 提出新功能想法和改进建议
3. **💻 代码贡献** - 提交Pull Request改进代码
4. **📚 文档改进** - 完善项目文档和使用说明
5. **🌍 翻译** - 帮助翻译界面文本到其他语言

### 开发流程

1. Fork 项目到你的GitHub账户
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 添加适当的注释和文档
- 确保代码通过所有测试

### 提交信息规范

```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 [Apache-2.0 许可证](LICENSE) - 查看 LICENSE 文件了解详情。

## 🙏 致谢

感谢以下开源项目和贡献者：

- [HLS.js](https://github.com/video-dev/hls.js/) - 强大的视频播放核心
- [Express](https://expressjs.com/) - 快速、极简的Node.js后端框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的超集，提供类型安全
- [Axios](https://axios-http.com/) - 基于Promise的HTTP客户端

特别感谢所有为项目贡献代码、报告问题和提供建议的开发者们！

## ⚠️ 免责声明

本项目仅供学习交流使用，不提供任何视频内容。所有视频资源均来自第三方API接口，本项目不存储任何视频文件。

请用户：
- 遵守当地法律法规
- 支持正版内容
- 尊重版权所有者的权益
- 仅将本项目用于个人学习和研究

## 📞 联系我们

- 🏠 **项目主页**: [https://github.com/your-username/YouTV](https://github.com/your-username/YouTV)
- 🐛 **问题反馈**: [Issues](https://github.com/your-username/YouTV/issues)
- 💬 **讨论交流**: [Discussions](https://github.com/your-username/YouTV/discussions)
- 📧 **邮件联系**: [your-email@example.com](mailto:your-email@example.com)

## 🌟 Star History

如果这个项目对你有帮助，请给我们一个 ⭐️ 支持！

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/YouTV&type=Date)](https://star-history.com/#your-username/YouTV&Date)

---

<div align="center">
  <p><strong>YouTV</strong> - 让观影更自由 🎬</p>
  <p>Made with ❤️ by YouTV Team</p>

  <p>
    <a href="#top">回到顶部</a>
  </p>
</div>

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { config, log } from './utils/config.js';
import { sha256Hash } from './utils/crypto.js';
import proxyRouter from './routes/proxy.js';
import apiRouter from './routes/index.js';
import doubanRouter from './routes/douban.js';
import { startPeriodicHealthCheck } from './utils/healthCheck.js';
import { startCacheCleanup } from './utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "http:", "blob:"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);
app.use('/proxy', limiter);

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 日志中间件
app.use((req, res, next) => {
  log(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

/**
 * 渲染页面并注入密码哈希
 */
async function renderPage(filePath: string, password: string): Promise<string> {
  let content = fs.readFileSync(filePath, 'utf8');

  if (password !== '') {
    const sha256 = await sha256Hash(password);
    content = content.replace('{{PASSWORD}}', sha256);
  } else {
    content = content.replace('{{PASSWORD}}', '');
  }

  return content;
}

// 主页路由
app.get(['/', '/index.html'], async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../public/index.html');
    const content = await renderPage(filePath, config.password);
    res.send(content);
  } catch (error) {
    console.error('页面渲染错误:', error);
    res.status(500).send('读取静态页面失败');
  }
});

// 播放器页面路由
app.get('/player.html', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../public/player.html');
    const content = await renderPage(filePath, config.password);
    res.send(content);
  } catch (error) {
    console.error('播放器页面渲染错误:', error);
    res.status(500).send('读取静态页面失败');
  }
});

// 搜索页面路由
app.get('/s=:keyword', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../public/index.html');
    const content = await renderPage(filePath, config.password);
    res.send(content);
  } catch (error) {
    console.error('搜索页面渲染错误:', error);
    res.status(500).send('读取静态页面失败');
  }
});

// API路由
app.use('/api', apiRouter);
app.use('/api/douban', doubanRouter);
app.use('/proxy', proxyRouter);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: config.cacheMaxAge,
  etag: true,
  lastModified: true
}));

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.debug ? err.message : 'Something went wrong'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// 启动服务器
app.listen(config.port, () => {
  console.log(`🚀 YouTV服务器运行在 http://localhost:${config.port}`);

  if (config.password !== '') {
    console.log('🔒 登录密码已设置');
  }

  if (config.debug) {
    console.log('🐛 调试模式已启用');
    console.log('⚙️  配置:', {
      ...config,
      password: config.password ? '******' : ''
    });
  }

  // 启动后台服务
  console.log('🔧 启动后台服务...');

  // 启动API源健康检查（每10分钟检查一次）
  startPeriodicHealthCheck(10);
  console.log('✅ API源健康检查已启动');

  // 启动缓存清理（每30分钟清理一次）
  startCacheCleanup(30);
  console.log('✅ 缓存清理服务已启动');

  console.log('✨ YouTV已准备就绪！');
});

export default app;

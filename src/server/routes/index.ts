import express from 'express';
import searchRouter from './search.js';
import detailRouter from './detail.js';
import sourcesRouter from './sources.js';
import trendingRouter from './trending.js';

const router = express.Router();

// API路由
router.use('/search', searchRouter);
router.use('/detail', detailRouter);
router.use('/sources', sourcesRouter);
router.use('/trending', trendingRouter);

// API健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'YouTV API'
  });
});

// API信息
router.get('/info', (req, res) => {
  res.json({
    name: 'YouTV API',
    version: '1.0.0',
    description: '免费在线视频搜索与观看平台 API',
    endpoints: {
      search: '/api/search?q=关键词&sources=源代码&page=页码',
      detail: '/api/detail?id=视频ID&source=源代码',
      sources: '/api/sources',
      trending: '/api/trending?type=movie|tv&limit=12',
      health: '/api/health'
    },
    documentation: 'https://github.com/youtv/api-docs'
  });
});

export default router;

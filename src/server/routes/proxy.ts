import express from 'express';
import { proxyMiddleware, handlePreflight } from '../middleware/proxy.js';

const router = express.Router();

// 预检请求处理
router.options('/:encodedUrl', handlePreflight);

// 代理路由
router.get('/:encodedUrl', proxyMiddleware);

export default router;

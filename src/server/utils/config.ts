import dotenv from 'dotenv';
import { ServerConfig } from '../../types/index.js';

// 加载环境变量
dotenv.config();

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '8080'),
  password: process.env.PASSWORD || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  timeout: parseInt(process.env.REQUEST_TIMEOUT || '10000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  cacheMaxAge: process.env.CACHE_MAX_AGE || '1d',
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  debug: process.env.DEBUG === 'true',
  blockedHosts: (process.env.BLOCKED_HOSTS || 'localhost,127.0.0.1,0.0.0.0,::1').split(','),
  blockedIpPrefixes: (process.env.BLOCKED_IP_PREFIXES || '192.168.,10.,172.').split(','),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
};

export const log = (...args: any[]) => {
  if (config.debug) {
    console.log('[DEBUG]', ...args);
  }
};

export const apiConfig = {
  search: {
    path: '?ac=videolist&wd=',
    pagePath: '?ac=videolist&wd={query}&pg={page}',
    headers: {
      'User-Agent': config.userAgent,
      'Accept': 'application/json',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },
    maxPages: 3
  },
  detail: {
    path: '?ac=detail&ids=',
    headers: {
      'User-Agent': config.userAgent,
      'Accept': 'application/json',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  }
};

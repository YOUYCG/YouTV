import axios from 'axios';
import { ApiSource } from '../../types/index.js';
import { getAllApiSources } from './apiSources.js';

/**
 * API源健康状态
 */
export interface HealthStatus {
  code: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

/**
 * 健康检查缓存
 */
const healthCache = new Map<string, HealthStatus>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 检查单个API源的健康状态
 */
export async function checkApiSourceHealth(code: string, source: ApiSource): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // 发送简单的测试请求
    const response = await axios.get(source.api, {
      timeout: 10000, // 10秒超时
      params: {
        ac: 'list',
        t: 1, // 电影分类
        pg: 1,
        h: 24 // 最近24小时
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const responseTime = Date.now() - startTime;
    
    // 检查响应是否有效
    const isHealthy = response.status === 200 && 
                     response.data && 
                     (typeof response.data === 'object' || typeof response.data === 'string');

    const status: HealthStatus = {
      code,
      name: source.name,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      lastCheck: new Date(),
      error: isHealthy ? undefined : '响应数据无效'
    };

    // 缓存结果
    healthCache.set(code, status);
    
    return status;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    const status: HealthStatus = {
      code,
      name: source.name,
      status: 'unhealthy',
      responseTime,
      lastCheck: new Date(),
      error: error.message || '请求失败'
    };

    // 缓存结果
    healthCache.set(code, status);
    
    return status;
  }
}

/**
 * 检查所有API源的健康状态
 */
export async function checkAllApiSourcesHealth(): Promise<HealthStatus[]> {
  const sources = getAllApiSources();
  const promises = Object.entries(sources).map(([code, source]) => 
    checkApiSourceHealth(code, source)
  );
  
  return Promise.all(promises);
}

/**
 * 获取健康的API源列表
 */
export function getHealthyApiSources(): string[] {
  const healthySources: string[] = [];
  
  for (const [code, status] of healthCache.entries()) {
    if (status.status === 'healthy' && 
        Date.now() - status.lastCheck.getTime() < CACHE_DURATION) {
      healthySources.push(code);
    }
  }
  
  return healthySources;
}

/**
 * 获取缓存的健康状态
 */
export function getCachedHealthStatus(code: string): HealthStatus | null {
  const status = healthCache.get(code);
  
  if (!status) return null;
  
  // 检查缓存是否过期
  if (Date.now() - status.lastCheck.getTime() > CACHE_DURATION) {
    healthCache.delete(code);
    return null;
  }
  
  return status;
}

/**
 * 获取所有缓存的健康状态
 */
export function getAllCachedHealthStatus(): HealthStatus[] {
  const statuses: HealthStatus[] = [];
  
  for (const [code, status] of healthCache.entries()) {
    // 清理过期缓存
    if (Date.now() - status.lastCheck.getTime() > CACHE_DURATION) {
      healthCache.delete(code);
    } else {
      statuses.push(status);
    }
  }
  
  return statuses;
}

/**
 * 清理健康检查缓存
 */
export function clearHealthCache(): void {
  healthCache.clear();
}

/**
 * 定期健康检查
 */
export function startPeriodicHealthCheck(intervalMinutes: number = 10): NodeJS.Timeout {
  const interval = intervalMinutes * 60 * 1000;
  
  return setInterval(async () => {
    try {
      console.log('开始定期健康检查...');
      const results = await checkAllApiSourcesHealth();
      const healthyCount = results.filter(r => r.status === 'healthy').length;
      console.log(`健康检查完成: ${healthyCount}/${results.length} 个源可用`);
    } catch (error) {
      console.error('定期健康检查失败:', error);
    }
  }, interval);
}

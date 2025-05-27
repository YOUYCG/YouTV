/**
 * 简单的内存缓存实现
 * 用于缓存搜索结果和API响应
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * 设置缓存项
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };

    this.cache.set(key, item);
  }

  /**
   * 获取缓存项
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let deletedCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 创建全局缓存实例
export const searchCache = new MemoryCache(500); // 搜索结果缓存
export const detailCache = new MemoryCache(200); // 详情缓存
export const healthCache = new MemoryCache(100); // 健康检查缓存

/**
 * 生成搜索缓存键
 */
export function generateSearchCacheKey(
  query: string, 
  sources: string[], 
  page: number = 1
): string {
  return `search:${query}:${sources.sort().join(',')}:${page}`;
}

/**
 * 生成详情缓存键
 */
export function generateDetailCacheKey(id: string, source: string): string {
  return `detail:${source}:${id}`;
}

/**
 * 定期清理过期缓存
 */
export function startCacheCleanup(intervalMinutes: number = 30): NodeJS.Timeout {
  return setInterval(() => {
    const searchDeleted = searchCache.cleanup();
    const detailDeleted = detailCache.cleanup();
    const healthDeleted = healthCache.cleanup();
    
    console.log(`缓存清理完成: 搜索${searchDeleted}, 详情${detailDeleted}, 健康${healthDeleted}`);
  }, intervalMinutes * 60 * 1000);
}

export { MemoryCache };

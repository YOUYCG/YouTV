import express from 'express';
import axios from 'axios';
import { config, log, apiConfig } from '../utils/config.js';
import { sanitizeInput } from '../utils/validation.js';
import { getApiSourceByCode } from '../utils/apiSources.js';
import { VideoItem } from '../../types/index.js';
import { getHealthyApiSources } from '../utils/healthCheck.js';
import { searchCache, generateSearchCacheKey } from '../utils/cache.js';

const router = express.Router();

/**
 * 获取热门/流行内容
 * GET /api/trending?type=movie|tv&limit=12
 */
router.get('/', async (req, res) => {
  try {
    const type = sanitizeInput(req.query.type as string) || 'movie';
    const limit = parseInt(req.query.limit as string) || 12;

    // 验证类型参数
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: '类型参数必须是 movie 或 tv'
      });
    }

    log(`热门内容请求: 类型=${type}, 限制=${limit}`);

    // 检查缓存
    const cacheKey = `trending_${type}_${limit}`;
    const cachedResult = searchCache.get(cacheKey);

    if (cachedResult) {
      log(`返回缓存的热门内容: ${type}`);
      return res.json(cachedResult);
    }

    // 获取健康的API源
    const healthySources = getHealthyApiSources();
    const sourcesToUse = healthySources.length > 0 ? healthySources.slice(0, 3) : ['bfzy', 'ffzy', 'lzzy'];

    log(`使用API源获取热门内容: ${sourcesToUse.join(',')}`);

    // 根据类型确定搜索关键词
    const searchQueries = type === 'movie' 
      ? ['2024', '2023', '热门', '最新', '电影']
      : ['2024', '2023', '热门', '最新', '电视剧'];

    // 并行搜索多个关键词和源
    const searchPromises = [];

    for (const sourceCode of sourcesToUse) {
      for (const query of searchQueries.slice(0, 2)) { // 每个源只搜索前2个关键词
        searchPromises.push(searchFromSource(sourceCode, query, type));
      }
    }

    // 等待所有搜索完成
    const searchResults = await Promise.all(searchPromises);

    // 合并和去重结果
    const allResults: VideoItem[] = [];
    const seenTitles = new Set<string>();

    searchResults.forEach(result => {
      if (result.results && result.results.length > 0) {
        result.results.forEach(item => {
          // 简单去重：基于标题
          const normalizedTitle = item.vod_name?.toLowerCase().replace(/\s+/g, '');
          if (normalizedTitle && !seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            allResults.push(item);
          }
        });
      }
    });

    // 过滤和排序结果
    let filteredResults = allResults.filter(item => {
      const typeName = item.type_name || '';
      const vodName = item.vod_name || '';

      // 根据类型过滤
      if (type === 'movie') {
        return typeName.includes('电影') || typeName.includes('影片');
      } else {
        return typeName.includes('电视剧') || typeName.includes('连续剧') || typeName.includes('剧集');
      }
    });

    // 按年份和评分排序（优先显示新内容）
    filteredResults.sort((a, b) => {
      const yearA = parseInt(a.vod_year || '0');
      const yearB = parseInt(b.vod_year || '0');
      
      // 优先按年份排序
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      
      // 然后按名称排序
      return (a.vod_name || '').localeCompare(b.vod_name || '');
    });

    // 限制结果数量
    filteredResults = filteredResults.slice(0, limit);

    // 构建响应结果
    const responseData = {
      code: 200,
      message: 'Success',
      type,
      total: filteredResults.length,
      list: filteredResults
    };

    // 缓存结果（缓存15分钟）
    if (filteredResults.length > 0) {
      searchCache.set(cacheKey, responseData, 900);
    }

    // 返回结果
    res.json(responseData);

  } catch (error: any) {
    console.error('热门内容API错误:', error);
    res.status(500).json({
      error: 'Trending content failed',
      message: '获取热门内容失败，请稍后重试',
      details: config.debug ? error.message : undefined
    });
  }
});

/**
 * 从指定源搜索内容
 */
async function searchFromSource(sourceCode: string, query: string, type: string) {
  try {
    const apiSource = getApiSourceByCode(sourceCode);
    if (!apiSource) {
      return { sourceCode, results: [], error: 'Unknown API source' };
    }

    const apiUrl = apiSource.api + apiConfig.search.path + encodeURIComponent(query);

    const response = await axios.get(apiUrl, {
      headers: {
        ...apiConfig.search.headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: config.timeout,
      maxRedirects: 3,
      validateStatus: (status) => status < 500
    });

    if (!response || !response.data || !response.data.list || !Array.isArray(response.data.list)) {
      return { sourceCode, results: [], error: 'Invalid response format' };
    }

    // 处理搜索结果
    const results: VideoItem[] = response.data.list.map((item: any) => ({
      ...item,
      source_name: apiSource.name,
      source_code: sourceCode
    }));

    return {
      sourceCode,
      results: results.slice(0, 10), // 每个源最多返回10个结果
      total: results.length
    };

  } catch (error: any) {
    log(`API ${sourceCode} 搜索热门内容失败:`, error.message);
    return {
      sourceCode,
      results: [],
      error: error.message
    };
  }
}

export default router;

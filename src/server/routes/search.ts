import express from 'express';
import axios from 'axios';
import { config, log, apiConfig } from '../utils/config.js';
import { sanitizeInput, isValidUrl } from '../utils/validation.js';
import { getApiSourceByCode, getAllApiSources } from '../utils/apiSources.js';
import { SearchResponse, VideoItem, CustomApiSource } from '../../types/index.js';
import { getHealthyApiSources } from '../utils/healthCheck.js';
import { searchCache, generateSearchCacheKey } from '../utils/cache.js';

const router = express.Router();

/**
 * 搜索视频内容
 * GET /api/search?q=关键词&sources=api1,api2&page=1
 */
router.get('/', async (req, res) => {
  try {
    const query = sanitizeInput(req.query.q as string);
    const sourcesParam = req.query.sources as string;
    const page = parseInt(req.query.page as string) || 1;
    const customApis = req.query.customApis ? JSON.parse(req.query.customApis as string) : [];

    if (!query) {
      return res.status(400).json({
        error: 'Missing search query',
        message: '请输入搜索关键词'
      });
    }

    if (!sourcesParam) {
      return res.status(400).json({
        error: 'Missing sources',
        message: '请选择至少一个数据源'
      });
    }

    let sources = sourcesParam.split(',').filter(s => s.trim());

    if (sources.length === 0) {
      return res.status(400).json({
        error: 'No valid sources',
        message: '没有有效的数据源'
      });
    }

    // 智能源选择：优先使用健康的源
    const healthySources = getHealthyApiSources();
    if (healthySources.length > 0) {
      // 重新排序，健康的源优先
      sources = sources.sort((a, b) => {
        const aHealthy = healthySources.includes(a);
        const bHealthy = healthySources.includes(b);
        if (aHealthy && !bHealthy) return -1;
        if (!aHealthy && bHealthy) return 1;
        return 0;
      });
    }

    log(`搜索请求: "${query}", 源: ${sources.join(',')}, 页码: ${page}`);

    // 检查缓存
    const cacheKey = generateSearchCacheKey(query, sources, page);
    const cachedResult = searchCache.get(cacheKey);

    if (cachedResult) {
      log(`返回缓存结果: ${query}`);
      return res.json(cachedResult);
    }

    // 并行搜索所有源
    const searchPromises = sources.map(async (sourceCode) => {
      try {
        let apiUrl: string;
        let sourceName: string;

        // 处理自定义API
        if (sourceCode.startsWith('custom_')) {
          const customIndex = parseInt(sourceCode.replace('custom_', ''));
          const customApi = customApis[customIndex] as CustomApiSource;

          if (!customApi || !isValidUrl(customApi.url)) {
            return { sourceCode, results: [], error: 'Invalid custom API' };
          }

          apiUrl = customApi.url + apiConfig.search.path + encodeURIComponent(query);
          if (page > 1) {
            apiUrl = customApi.url + apiConfig.search.pagePath
              .replace('{query}', encodeURIComponent(query))
              .replace('{page}', page.toString());
          }
          sourceName = customApi.name;
        } else {
          // 内置API
          const apiSource = getApiSourceByCode(sourceCode);
          if (!apiSource) {
            return { sourceCode, results: [], error: 'Unknown API source' };
          }

          apiUrl = apiSource.api + apiConfig.search.path + encodeURIComponent(query);
          if (page > 1) {
            apiUrl = apiSource.api + apiConfig.search.pagePath
              .replace('{query}', encodeURIComponent(query))
              .replace('{page}', page.toString());
          }
          sourceName = apiSource.name;
        }

        // 发起搜索请求，带重试机制
        let response = null;
        const maxRetries = 2;

        for (let retry = 0; retry <= maxRetries; retry++) {
          try {
            response = await axios.get(apiUrl, {
              headers: {
                ...apiConfig.search.headers,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              timeout: config.timeout * (retry + 1), // 递增超时时间
              maxRedirects: 3,
              validateStatus: (status) => status < 500 // 只重试服务器错误
            });
            break; // 成功则跳出重试循环
          } catch (error: any) {
            if (retry < maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
              log(`API ${sourceCode} 第${retry + 1}次重试...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))); // 递增延迟
              continue;
            }
            throw error;
          }
        }

        if (!response || !response.data || !response.data.list || !Array.isArray(response.data.list)) {
          return { sourceCode, results: [], error: 'Invalid response format' };
        }

        // 处理搜索结果
        const results: VideoItem[] = response.data.list.map((item: any) => ({
          ...item,
          source_name: sourceName,
          source_code: sourceCode,
          api_url: sourceCode.startsWith('custom_') ?
            customApis[parseInt(sourceCode.replace('custom_', ''))]?.url : undefined
        }));

        return {
          sourceCode,
          results,
          total: response.data.total || results.length,
          pagecount: response.data.pagecount || 1
        };

      } catch (error: any) {
        log(`API ${sourceCode} 搜索失败:`, error.message);
        return {
          sourceCode,
          results: [],
          error: error.message,
          total: 0,
          pagecount: 0
        };
      }
    });

    // 等待所有搜索完成
    const searchResults = await Promise.all(searchPromises);

    // 合并结果
    let allResults: VideoItem[] = [];
    let totalCount = 0;
    const sourceStats: Record<string, any> = {};

    searchResults.forEach(result => {
      if (result.results && result.results.length > 0) {
        allResults = allResults.concat(result.results);
        totalCount += result.total || result.results.length;
      }

      sourceStats[result.sourceCode] = {
        count: result.results?.length || 0,
        total: result.total || 0,
        pagecount: result.pagecount || 0,
        error: result.error || null
      };
    });

    // 构建响应结果
    const responseData = {
      code: 200,
      message: 'Success',
      query,
      page,
      total: totalCount,
      count: allResults.length,
      sources: sourceStats,
      list: allResults
    };

    // 缓存结果（只缓存有结果的搜索）
    if (allResults.length > 0) {
      searchCache.set(cacheKey, responseData, 300); // 缓存5分钟
    }

    // 返回搜索结果
    res.json(responseData);

  } catch (error: any) {
    console.error('搜索API错误:', error);
    res.status(500).json({
      error: 'Search failed',
      message: '搜索请求失败，请稍后重试',
      details: config.debug ? error.message : undefined
    });
  }
});

export default router;

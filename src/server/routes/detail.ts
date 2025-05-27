import express from 'express';
import axios from 'axios';
import { config, log, apiConfig } from '../utils/config.js';
import { isValidVideoId, isValidSourceCode, isValidUrl } from '../utils/validation.js';
import { getApiSourceByCode } from '../utils/apiSources.js';
import { DetailResponse, VideoDetail, Episode } from '../../types/index.js';

const router = express.Router();

/**
 * 获取视频详情
 * GET /api/detail?id=视频ID&source=源代码&customApi=自定义API&customDetail=详情API
 */
router.get('/', async (req, res) => {
  try {
    const videoId = req.query.id as string;
    const sourceCode = req.query.source as string;
    const customApi = req.query.customApi as string;
    const customDetail = req.query.customDetail as string;

    // 验证参数
    if (!videoId || !isValidVideoId(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: '无效的视频ID'
      });
    }

    if (!sourceCode || !isValidSourceCode(sourceCode)) {
      return res.status(400).json({
        error: 'Invalid source code',
        message: '无效的数据源代码'
      });
    }

    log(`获取视频详情: ID=${videoId}, 源=${sourceCode}`);

    let apiUrl: string;
    let sourceName: string;

    // 处理自定义API
    if (sourceCode.startsWith('custom_')) {
      if (!customApi || !isValidUrl(customApi)) {
        return res.status(400).json({
          error: 'Invalid custom API',
          message: '无效的自定义API'
        });
      }

      // 使用自定义详情API或默认API
      const baseUrl = customDetail || customApi;
      apiUrl = baseUrl + apiConfig.detail.path + encodeURIComponent(videoId);
      sourceName = '自定义源';
    } else {
      // 内置API
      const apiSource = getApiSourceByCode(sourceCode);
      if (!apiSource) {
        return res.status(400).json({
          error: 'Unknown API source',
          message: '未知的API源'
        });
      }

      apiUrl = apiSource.api + apiConfig.detail.path + encodeURIComponent(videoId);
      sourceName = apiSource.name;
    }

    // 发起详情请求
    const response = await axios.get(apiUrl, {
      headers: apiConfig.detail.headers,
      timeout: config.timeout,
      maxRedirects: 3
    });

    if (!response.data || !response.data.list || !Array.isArray(response.data.list)) {
      return res.status(404).json({
        error: 'Video not found',
        message: '未找到视频信息'
      });
    }

    const videoData = response.data.list[0] as VideoDetail;
    if (!videoData) {
      return res.status(404).json({
        error: 'Video not found',
        message: '未找到视频信息'
      });
    }

    // 处理播放链接
    const episodes: Episode[] = [];
    if (videoData.vod_play_url) {
      const playUrls = videoData.vod_play_url.split('#').filter(url => url.trim());
      
      playUrls.forEach((urlPair, index) => {
        const parts = urlPair.split('$');
        const episodeName = parts[0] || `第${index + 1}集`;
        const episodeUrl = parts[1] || parts[0];
        
        if (episodeUrl && episodeUrl.trim()) {
          episodes.push({
            name: episodeName,
            url: episodeUrl.trim(),
            index: index
          });
        }
      });
    }

    // 构建返回数据
    const result = {
      code: 200,
      message: 'Success',
      videoInfo: {
        ...videoData,
        source_name: sourceName,
        source_code: sourceCode,
        desc: videoData.vod_content || '暂无简介',
        type: videoData.type_name || '未知',
        year: videoData.vod_year || '',
        area: videoData.vod_area || '',
        director: videoData.vod_director || '',
        actor: videoData.vod_actor || '',
        remarks: videoData.vod_remarks || ''
      },
      episodes: episodes,
      episodeCount: episodes.length
    };

    res.json(result);

  } catch (error: any) {
    console.error('详情API错误:', error);
    
    if (error.response?.status === 404) {
      res.status(404).json({
        error: 'Video not found',
        message: '未找到视频信息'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        error: 'Request timeout',
        message: '请求超时，请稍后重试'
      });
    } else {
      res.status(500).json({
        error: 'Detail fetch failed',
        message: '获取详情失败，请稍后重试',
        details: config.debug ? error.message : undefined
      });
    }
  }
});

export default router;

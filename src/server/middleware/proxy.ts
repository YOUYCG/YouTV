import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config, log } from '../utils/config.js';
import { isValidUrl, filterSensitiveHeaders } from '../utils/validation.js';

/**
 * 代理中间件 - 处理视频流和API请求的代理
 */
export async function proxyMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const encodedUrl = req.params.encodedUrl;
    
    if (!encodedUrl) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const targetUrl = decodeURIComponent(encodedUrl);

    // 安全验证
    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    log(`代理请求: ${targetUrl}`);

    // 添加请求超时和重试逻辑
    const maxRetries = config.maxRetries;
    let retries = 0;

    const makeRequest = async (): Promise<any> => {
      try {
        return await axios({
          method: 'get',
          url: targetUrl,
          responseType: 'stream',
          timeout: config.timeout,
          headers: {
            'User-Agent': config.userAgent,
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          maxRedirects: 5
        });
      } catch (error: any) {
        if (retries < maxRetries) {
          retries++;
          log(`重试请求 (${retries}/${maxRetries}): ${targetUrl}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // 递增延迟
          return makeRequest();
        }
        throw error;
      }
    };

    const response = await makeRequest();

    // 转发响应头（过滤敏感头）
    const headers = filterSensitiveHeaders(response.headers);
    
    // 设置CORS头
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    res.set(headers);

    // 管道传输响应流
    response.data.pipe(res);

  } catch (error: any) {
    console.error('代理请求错误:', error.message);
    
    if (error.response) {
      res.status(error.response.status || 500);
      if (error.response.data) {
        error.response.data.pipe(res);
      } else {
        res.json({ error: 'Proxy request failed', details: error.message });
      }
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Request timeout', message: '请求超时，请稍后重试' });
    } else {
      res.status(500).json({ 
        error: 'Proxy request failed', 
        message: `请求失败: ${error.message}` 
      });
    }
  }
}

/**
 * 预检请求处理
 */
export function handlePreflight(req: Request, res: Response) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
}

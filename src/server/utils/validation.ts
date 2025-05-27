import { config } from './config.js';

/**
 * 验证URL是否安全可访问
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const allowedProtocols = ['http:', 'https:'];

    // 检查协议
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }

    // 检查被阻止的主机名
    if (config.blockedHosts.includes(parsed.hostname)) {
      return false;
    }

    // 检查被阻止的IP前缀
    for (const prefix of config.blockedIpPrefixes) {
      if (parsed.hostname.startsWith(prefix)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 清理和验证输入字符串
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除潜在的HTML标签
    .substring(0, 1000); // 限制长度
}

/**
 * 验证视频ID格式
 */
export function isValidVideoId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  
  // 基本格式验证：只允许数字、字母、下划线、连字符
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 50;
}

/**
 * 验证API源代码
 */
export function isValidSourceCode(sourceCode: string): boolean {
  if (typeof sourceCode !== 'string') {
    return false;
  }
  
  // 允许内置API代码或自定义API格式
  return /^[a-zA-Z0-9_-]+$/.test(sourceCode) || sourceCode.startsWith('custom_');
}

/**
 * 过滤敏感HTTP头
 */
export function filterSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
  const sensitiveHeaders = (
    process.env.FILTERED_HEADERS || 
    'content-security-policy,cookie,set-cookie,x-frame-options,access-control-allow-origin'
  ).split(',');
  
  const filtered = { ...headers };
  
  sensitiveHeaders.forEach(header => {
    delete filtered[header.toLowerCase()];
  });
  
  return filtered;
}

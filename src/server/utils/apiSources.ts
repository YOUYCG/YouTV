import { ApiSource } from '../../types/index.js';

/**
 * 内置API源配置
 * 基于LibreTV的API源，但进行了现代化改进
 * 优化了API源的可靠性和稳定性
 */
export const API_SOURCES: Record<string, ApiSource> = {
  // 主流视频源 - 经过测试的可靠源
  bfzy: {
    name: '暴风影视',
    api: 'https://bfzyapi.com/api.php/provide/vod',
    adult: false
  },

  tyyszy: {
    name: '太阳影视',
    api: 'https://api.tyun77.cn/api.php/provide/vod',
    adult: false
  },

  // 新增可靠的API源
  ffzy: {
    name: '非凡影视',
    api: 'https://cj.ffzyapi.com/api.php/provide/vod',
    adult: false
  },

  lzzy: {
    name: '量子影视',
    api: 'https://cj.lziapi.com/api.php/provide/vod',
    adult: false
  },

  hnzy: {
    name: '红牛影视',
    api: 'https://www.hongniuzy2.com/api.php/provide/vod',
    adult: false
  },

  ukzy: {
    name: '优酷影视',
    api: 'https://api.ukuapi.com/api.php/provide/vod',
    adult: false
  },

  // 备用源
  dyttzy: {
    name: '大雅影视',
    api: 'https://www.dyttzy.com/api.php/provide/vod',
    adult: false
  },

  kuaikan: {
    name: '快看影视',
    api: 'https://www.kuaikanzy.net/api.php/provide/vod',
    adult: false
  },

  // 高清源
  haiwaikan: {
    name: '海外看',
    api: 'https://haiwaikan.com/api.php/provide/vod',
    adult: false
  },

  bdzy: {
    name: '百度影视',
    api: 'https://api.apibdzy.com/api.php/provide/vod',
    adult: false
  }
};

/**
 * 获取所有可用的API源
 */
export function getAllApiSources(): Record<string, ApiSource> {
  return API_SOURCES;
}

/**
 * 获取普通内容API源
 */
export function getNormalApiSources(): Record<string, ApiSource> {
  const normalSources: Record<string, ApiSource> = {};

  Object.entries(API_SOURCES).forEach(([key, source]) => {
    if (!source.adult) {
      normalSources[key] = source;
    }
  });

  return normalSources;
}

/**
 * 获取成人内容API源
 */
export function getAdultApiSources(): Record<string, ApiSource> {
  const adultSources: Record<string, ApiSource> = {};

  Object.entries(API_SOURCES).forEach(([key, source]) => {
    if (source.adult) {
      adultSources[key] = source;
    }
  });

  return adultSources;
}

/**
 * 根据代码获取API源信息
 */
export function getApiSourceByCode(code: string): ApiSource | null {
  return API_SOURCES[code] || null;
}

/**
 * 验证API源是否存在
 */
export function isValidApiSource(code: string): boolean {
  return code in API_SOURCES;
}

// API相关类型定义
export interface VideoItem {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  type_name?: string;
  vod_year?: string;
  vod_area?: string;
  vod_director?: string;
  vod_actor?: string;
  vod_content?: string;
  vod_play_url?: string;
  source_name?: string;
  source_code?: string;
  api_url?: string;
}

export interface SearchResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number;
  total: number;
  list: VideoItem[];
}

export interface VideoDetail {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  type_name?: string;
  vod_year?: string;
  vod_area?: string;
  vod_director?: string;
  vod_actor?: string;
  vod_content?: string;
  vod_play_from?: string;
  vod_play_server?: string;
  vod_play_note?: string;
  vod_play_url?: string;
}

export interface DetailResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number;
  total: number;
  list: VideoDetail[];
}

// API源配置
export interface ApiSource {
  name: string;
  api: string;
  adult?: boolean;
}

export interface CustomApiSource {
  name: string;
  url: string;
  detail?: string;
  isAdult?: boolean;
}

// 服务器配置
export interface ServerConfig {
  port: number;
  password: string;
  corsOrigin: string;
  timeout: number;
  maxRetries: number;
  cacheMaxAge: string;
  userAgent: string;
  debug: boolean;
  blockedHosts: string[];
  blockedIpPrefixes: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

// 请求/响应类型
export interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// 播放器相关
export interface Episode {
  name: string;
  url: string;
  index: number;
}

export interface PlayerConfig {
  autoplay: boolean;
  volume: number;
  playbackRate: number;
  adFilteringEnabled: boolean;
}

// 用户设置
export interface UserSettings {
  selectedAPIs: string[];
  customAPIs: CustomApiSource[];
  yellowFilterEnabled: boolean;
  adFilteringEnabled: boolean;
  doubanEnabled: boolean;
  theme: 'dark' | 'light';
}

// 搜索历史
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

// 观看历史
export interface ViewingHistoryItem {
  videoId: string;
  videoName: string;
  episodeIndex: number;
  timestamp: number;
  progress: number;
  sourceCode: string;
}

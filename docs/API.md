# YouTV API 文档

YouTV 提供了一套完整的 RESTful API，支持视频搜索、详情获取、热门内容推荐等功能。

## 📋 目录

- [基础信息](#基础信息)
- [认证](#认证)
- [搜索 API](#搜索-api)
- [视频详情 API](#视频详情-api)
- [热门内容 API](#热门内容-api)
- [豆瓣推荐 API](#豆瓣推荐-api)
- [API 源管理](#api-源管理)
- [代理服务](#代理服务)
- [错误处理](#错误处理)
- [速率限制](#速率限制)

## 🌐 基础信息

### Base URL
```
http://localhost:8080/api
```

### 请求格式
- **Content-Type**: `application/json`
- **字符编码**: UTF-8
- **HTTP 方法**: GET, POST

### 响应格式
所有 API 响应都采用统一的 JSON 格式：

```json
{
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 认证

YouTV 支持可选的密码保护。如果启用了密码保护，需要在前端进行密码验证。

### 密码验证
密码验证在前端进行，使用 SHA-256 哈希比较。

## 🔍 搜索 API

### 搜索视频

搜索电影、电视剧、动漫等视频内容。

**请求**
```http
GET /api/search?q={keyword}&sources={sources}&page={page}
```

**参数**

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `q` | string | ✅ | 搜索关键词 | `复仇者联盟` |
| `sources` | string | ❌ | API源代码，多个用逗号分隔 | `bfzy,ffzy` |
| `page` | number | ❌ | 页码，默认为1 | `1` |
| `customApis` | string | ❌ | 自定义API源JSON字符串 | `[{"name":"自定义源","api":"..."}]` |

**响应示例**
```json
{
  "code": 200,
  "message": "搜索成功",
  "total": 150,
  "page": 1,
  "limit": 20,
  "list": [
    {
      "vod_id": "12345",
      "vod_name": "复仇者联盟4：终局之战",
      "vod_pic": "https://example.com/poster.jpg",
      "vod_remarks": "HD",
      "vod_year": "2019",
      "type_name": "动作片",
      "source_name": "某某影视",
      "source_code": "bfzy"
    }
  ]
}
```

**错误响应**
```json
{
  "code": 400,
  "message": "搜索关键词不能为空",
  "error": "Missing required parameter: q"
}
```

## 📺 视频详情 API

### 获取视频详情

获取指定视频的详细信息，包括剧集列表和播放链接。

**请求**
```http
GET /api/detail?id={video_id}&source={source_code}
```

**参数**

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `id` | string | ✅ | 视频ID | `12345` |
| `source` | string | ✅ | API源代码 | `bfzy` |

**响应示例**
```json
{
  "code": 200,
  "message": "获取详情成功",
  "data": {
    "vod_id": "12345",
    "vod_name": "复仇者联盟4：终局之战",
    "vod_pic": "https://example.com/poster.jpg",
    "vod_content": "电影简介...",
    "vod_year": "2019",
    "vod_area": "美国",
    "vod_lang": "英语",
    "vod_actor": "小罗伯特·唐尼,克里斯·埃文斯",
    "vod_director": "安东尼·罗素,乔·罗素",
    "vod_play_from": "线路1$$$线路2",
    "vod_play_url": "第01集$https://example.com/ep1.m3u8#第02集$https://example.com/ep2.m3u8$$$第01集$https://example2.com/ep1.m3u8",
    "source_name": "某某影视",
    "source_code": "bfzy"
  }
}
```

## 🔥 热门内容 API

### 获取热门内容

获取当前热门的电影和电视剧内容。

**请求**
```http
GET /api/trending?type={type}&limit={limit}
```

**参数**

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `type` | string | ❌ | 内容类型：movie（电影）或tv（电视剧） | `movie` |
| `limit` | number | ❌ | 返回数量限制，默认12 | `12` |

**响应示例**
```json
{
  "code": 200,
  "message": "Success",
  "type": "movie",
  "total": 12,
  "list": [
    {
      "vod_id": "67890",
      "vod_name": "阿凡达2：水之道",
      "vod_pic": "https://example.com/avatar2.jpg",
      "vod_year": "2022",
      "vod_remarks": "HD",
      "type_name": "科幻片",
      "source_name": "某某影视",
      "source_code": "bfzy"
    }
  ]
}
```

## 🎭 豆瓣推荐 API

### 获取豆瓣推荐

获取豆瓣高分推荐内容。

**请求**
```http
GET /api/douban?type={type}&limit={limit}
```

**参数**

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `type` | string | ❌ | 内容类型：movie（电影）或tv（电视剧） | `movie` |
| `limit` | number | ❌ | 返回数量限制，默认6 | `6` |

**响应示例**
```json
{
  "code": 200,
  "message": "Success",
  "type": "movie",
  "total": 6,
  "list": [
    {
      "title": "肖申克的救赎",
      "rating": "9.7",
      "year": "1994",
      "cover": "https://img.douban.com/view/photo/s_ratio_poster/public/p480747492.jpg",
      "url": "https://movie.douban.com/subject/1292052/",
      "directors": ["弗兰克·德拉邦特"],
      "actors": ["蒂姆·罗宾斯", "摩根·弗里曼"],
      "genres": ["剧情", "犯罪"]
    }
  ]
}
```

## 🔧 API 源管理

### 获取 API 源列表

获取所有可用的视频 API 源信息。

**请求**
```http
GET /api/sources
```

**响应示例**
```json
{
  "code": 200,
  "message": "Success",
  "sources": [
    {
      "name": "某某影视",
      "code": "bfzy",
      "api": "https://api.example.com/",
      "categories": ["movie", "tv", "anime"],
      "adult": false,
      "status": "healthy",
      "lastCheck": "2024-01-01T00:00:00.000Z",
      "responseTime": 150
    }
  ],
  "healthy": ["bfzy", "ffzy"],
  "total": 10,
  "healthyCount": 8
}
```

### 健康检查

检查 API 源的健康状态。

**请求**
```http
GET /api/sources/health
```

**响应示例**
```json
{
  "code": 200,
  "message": "Health check completed",
  "results": {
    "bfzy": {
      "status": "healthy",
      "responseTime": 150,
      "lastCheck": "2024-01-01T00:00:00.000Z"
    },
    "ffzy": {
      "status": "unhealthy",
      "error": "Connection timeout",
      "lastCheck": "2024-01-01T00:00:00.000Z"
    }
  },
  "summary": {
    "total": 10,
    "healthy": 8,
    "unhealthy": 2
  }
}
```

## 🌐 代理服务

### 视频流代理

代理视频流和解决跨域问题。

**请求**
```http
GET /proxy/{encodedUrl}
```

**参数**

| 参数 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `encodedUrl` | string | ✅ | URL编码的视频地址 | `https%3A//example.com/video.m3u8` |

**响应**
直接返回代理的视频流数据，支持：
- HLS (.m3u8) 流
- MP4 视频文件
- 其他视频格式

**错误响应**
```json
{
  "error": "Proxy request failed",
  "message": "请求失败: Connection timeout"
}
```

## ❌ 错误处理

### 错误代码

| 代码 | 描述 | 说明 |
|------|------|------|
| `200` | 成功 | 请求成功处理 |
| `400` | 请求错误 | 参数错误或格式不正确 |
| `401` | 未授权 | 需要密码验证 |
| `404` | 未找到 | 资源不存在 |
| `408` | 请求超时 | 请求处理超时 |
| `429` | 请求过多 | 触发速率限制 |
| `500` | 服务器错误 | 内部服务器错误 |

### 错误响应格式

```json
{
  "code": 400,
  "error": "Bad Request",
  "message": "参数错误：缺少必需参数 q",
  "details": "Missing required parameter: q",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚦 速率限制

为了保护服务器资源，API 实施了速率限制：

### 限制规则
- **时间窗口**: 15分钟
- **最大请求数**: 100次/IP
- **超出限制**: 返回 429 状态码

### 响应头
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### 超出限制响应
```json
{
  "code": 429,
  "error": "Too Many Requests",
  "message": "请求过于频繁，请稍后重试",
  "retryAfter": 900
}
```

## 📝 使用示例

### JavaScript/Fetch
```javascript
// 搜索视频
async function searchVideos(keyword) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
  const data = await response.json();
  return data;
}

// 获取视频详情
async function getVideoDetail(id, source) {
  const response = await fetch(`/api/detail?id=${id}&source=${source}`);
  const data = await response.json();
  return data;
}
```

### cURL
```bash
# 搜索视频
curl -X GET "http://localhost:8080/api/search?q=复仇者联盟"

# 获取视频详情
curl -X GET "http://localhost:8080/api/detail?id=12345&source=bfzy"

# 获取热门内容
curl -X GET "http://localhost:8080/api/trending?type=movie&limit=10"
```

## 🔗 相关链接

- [项目主页](https://github.com/your-username/YouTV)
- [部署指南](./DEPLOYMENT.md)
- [贡献指南](../CONTRIBUTING.md)
- [问题反馈](https://github.com/your-username/YouTV/issues)

---

**注意**: 请遵守 API 使用条款和当地法律法规。

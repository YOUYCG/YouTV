import express from 'express';
import axios from 'axios';
import { config, log } from '../utils/config.js';

const router = express.Router();

// 豆瓣热门电影和电视剧数据
const DOUBAN_MOVIES = [
  {
    id: 'douban_1',
    title: '流浪地球2',
    year: '2023',
    rating: '8.3',
    poster: 'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2885955371.jpg',
    type: '电影',
    genre: '科幻/冒险',
    description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。'
  },
  {
    id: 'douban_2', 
    title: '满江红',
    year: '2023',
    rating: '8.0',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2886345503.jpg',
    type: '电影',
    genre: '喜剧/悬疑',
    description: '南宋绍兴年间，岳飞死后四年，秦桧率兵与金国会谈。'
  },
  {
    id: 'douban_3',
    title: '深海',
    year: '2023', 
    rating: '7.8',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884466043.jpg',
    type: '电影',
    genre: '动画/奇幻',
    description: '一个现代少女意外进入梦幻的深海世界。'
  },
  {
    id: 'douban_4',
    title: '熊出没·伴我"熊芯"',
    year: '2023',
    rating: '7.5',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885542022.jpg',
    type: '电影', 
    genre: '动画/家庭',
    description: '熊大熊二与光头强的全新冒险故事。'
  },
  {
    id: 'douban_5',
    title: '中国乒乓之绝地反击',
    year: '2023',
    rating: '7.2',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884137874.jpg',
    type: '电影',
    genre: '剧情/运动', 
    description: '讲述中国乒乓球队在低谷期重新崛起的故事。'
  },
  {
    id: 'douban_6',
    title: '无名',
    year: '2023',
    rating: '7.1',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884835471.jpg',
    type: '电影',
    genre: '剧情/动作',
    description: '1930年代上海，地下工作者与敌人斗智斗勇。'
  }
];

const DOUBAN_TV_SHOWS = [
  {
    id: 'douban_tv_1',
    title: '狂飙',
    year: '2023',
    rating: '9.0',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2886308725.jpg',
    type: '电视剧',
    genre: '剧情/犯罪',
    description: '一线刑警安欣和黑恶势力的较量。'
  },
  {
    id: 'douban_tv_2',
    title: '三体',
    year: '2023', 
    rating: '8.7',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885955680.jpg',
    type: '电视剧',
    genre: '科幻/剧情',
    description: '基于刘慈欣同名科幻小说改编。'
  },
  {
    id: 'douban_tv_3',
    title: '去有风的地方',
    year: '2023',
    rating: '8.2',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884466789.jpg',
    type: '电视剧',
    genre: '爱情/生活',
    description: '都市女性寻找内心平静的治愈之旅。'
  },
  {
    id: 'douban_tv_4',
    title: '显微镜下的大明',
    year: '2023',
    rating: '8.5',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2885542789.jpg',
    type: '电视剧',
    genre: '古装/剧情',
    description: '明朝基层官员的生存智慧。'
  },
  {
    id: 'douban_tv_5',
    title: '重紫',
    year: '2023',
    rating: '7.8',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884137999.jpg',
    type: '电视剧',
    genre: '古装/奇幻',
    description: '仙侠世界的爱恨情仇。'
  },
  {
    id: 'douban_tv_6',
    title: '打开生活的正确方式',
    year: '2023',
    rating: '7.6',
    poster: 'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2884835999.jpg',
    type: '电视剧',
    genre: '都市/家庭',
    description: '现代都市生活的酸甜苦辣。'
  }
];

/**
 * 获取豆瓣推荐内容
 * GET /api/douban?type=movie|tv&limit=6
 */
router.get('/', async (req, res) => {
  try {
    const type = req.query.type as string || 'movie';
    const limit = parseInt(req.query.limit as string) || 6;
    
    log(`获取豆瓣推荐: 类型=${type}, 数量=${limit}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let data;
    if (type === 'tv') {
      data = DOUBAN_TV_SHOWS.slice(0, limit);
    } else {
      data = DOUBAN_MOVIES.slice(0, limit);
    }
    
    // 随机打乱顺序，模拟"换一批"效果
    if (req.query.refresh === 'true') {
      data = [...data].sort(() => Math.random() - 0.5);
    }
    
    res.json({
      code: 200,
      message: 'Success',
      type,
      total: data.length,
      list: data
    });
    
  } catch (error: any) {
    console.error('豆瓣API错误:', error);
    res.status(500).json({
      error: 'Douban fetch failed',
      message: '获取推荐内容失败，请稍后重试',
      details: config.debug ? error.message : undefined
    });
  }
});

export default router;

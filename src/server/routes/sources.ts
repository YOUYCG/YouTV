import express from 'express';
import { getAllApiSources, getNormalApiSources, getAdultApiSources } from '../utils/apiSources.js';

const router = express.Router();

/**
 * 获取所有API源
 * GET /api/sources
 */
router.get('/', (req, res) => {
  try {
    const includeAdult = req.query.includeAdult === 'true';
    
    let sources;
    if (includeAdult) {
      sources = getAllApiSources();
    } else {
      sources = getNormalApiSources();
    }

    res.json({
      code: 200,
      message: 'Success',
      sources: sources,
      count: Object.keys(sources).length
    });
  } catch (error: any) {
    console.error('获取API源错误:', error);
    res.status(500).json({
      error: 'Failed to get sources',
      message: '获取数据源失败'
    });
  }
});

/**
 * 获取普通内容API源
 * GET /api/sources/normal
 */
router.get('/normal', (req, res) => {
  try {
    const sources = getNormalApiSources();
    
    res.json({
      code: 200,
      message: 'Success',
      sources: sources,
      count: Object.keys(sources).length
    });
  } catch (error: any) {
    console.error('获取普通API源错误:', error);
    res.status(500).json({
      error: 'Failed to get normal sources',
      message: '获取普通数据源失败'
    });
  }
});

/**
 * 获取成人内容API源
 * GET /api/sources/adult
 */
router.get('/adult', (req, res) => {
  try {
    const sources = getAdultApiSources();
    
    res.json({
      code: 200,
      message: 'Success',
      sources: sources,
      count: Object.keys(sources).length
    });
  } catch (error: any) {
    console.error('获取成人API源错误:', error);
    res.status(500).json({
      error: 'Failed to get adult sources',
      message: '获取成人数据源失败'
    });
  }
});

export default router;

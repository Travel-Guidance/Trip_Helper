const redis = require('../config/redis');

/**
 * Redis 캐시 미들웨어
 * @param {number} ttl - 캐시 유지 시간(초), 기본 5분
 */
const cache = (ttl = 300) => async (req, res, next) => {
  const key = `cache:${req.method}:${req.originalUrl}`;
  try {
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
  } catch {
    // Redis 미연결 시 캐시 건너뜀
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = data => {
    if (res.statusCode === 200) {
      redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
    }
    res.set('X-Cache', 'MISS');
    return originalJson(data);
  };
  next();
};

module.exports = cache;

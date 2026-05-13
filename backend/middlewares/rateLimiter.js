const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');


class RedisStore {
  constructor(client, prefix = 'rl:') {
    this.client = client;
    this.prefix = prefix;
  }

  async increment(key) {
    const rKey = `${this.prefix}${key}`;
    try {
      const [[, count]] = await this.client
        .multi()
        .incr(rKey)
        .expire(rKey, 60)
        .exec();
      return { totalHits: count, resetTime: new Date(Date.now() + 60 * 1000) };
    } catch {
      return { totalHits: 1, resetTime: new Date(Date.now() + 60 * 1000) };
    }
  }

  async decrement(key) {
    await this.client.decr(`${this.prefix}${key}`).catch(() => {});
  }

  async resetKey(key) {
    await this.client.del(`${this.prefix}${key}`).catch(() => {});
  }
}

function makeStore(prefix) {
  try {
    return new RedisStore(redis, prefix);
  } catch {
    return undefined; // fallback to in-memory
  }
}

function isLocalhost(req) {
  const ip = req.ip || '';
  return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.');
}

// 일반 API: 분당 100회
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  skip: req => isLocalhost(req) || req.path === '/tours/photo' || req.path.startsWith('/maps/'),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:gen:'),
  handler: (req, res) => {
    console.warn(`[요청 제한] 일반 API 한도 초과: ${req.ip} -> ${req.originalUrl}`);
    res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  },
});

// 지도 API: 분당 300회 (경로·지오코딩은 화면 로드마다 다수 발생)
const mapsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  skip: req => isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:maps:'),
  handler: (req, res) => {
    console.warn(`[요청 제한] 지도 API 한도 초과: ${req.ip} -> ${req.originalUrl}`);
    res.status(429).json({ error: '지도 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' });
  },
});

// AI 엔드포인트
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:ai:'),
  handler: (req, res) => {
    console.warn(`[요청 제한] AI API 한도 초과: ${req.ip} -> ${req.originalUrl}`);
    res.status(429).json({ error: 'AI 요청 한도를 초과했습니다. 1분 후 다시 시도해주세요.' });
  },
});

module.exports = { generalLimiter, mapsLimiter, aiLimiter };

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

// 일반 API: 분당 60회
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: req => req.path === '/tours/photo',
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:gen:'),
  handler: (_req, res) =>
    res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }),
});

// AI 엔드포인트
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:ai:'),
  handler: (_req, res) =>
    res.status(429).json({ error: 'AI 요청 한도를 초과했습니다. 1분 후 다시 시도해주세요.' }),
});

module.exports = { generalLimiter, aiLimiter };

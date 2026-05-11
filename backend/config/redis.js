const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: times => Math.min(times * 100, 3000),
  enableOfflineQueue: false,
  lazyConnect: true,
  keepAlive: 10000,
  reconnectOnError: err => err.message.includes('ECONNRESET'),
});

redis.once('ready', () => console.log('Redis connected'));
redis.on('error', err => console.error('Redis error:', err.message));

redis.connect().catch(() => {});

module.exports = redis;

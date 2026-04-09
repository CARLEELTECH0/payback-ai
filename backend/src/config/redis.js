const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisConnection = null;

const createRedisConnection = () => {
  if (redisConnection) return redisConnection;

  redisConnection = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 5) {
        logger.warn('Redis max retries reached — giving up. Start Redis or use Docker.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis reconnecting... attempt ${times}`);
      return delay;
    },
    lazyConnect: true,
  });

  redisConnection.on('connect', () => {
    logger.info('Redis connected');
  });

  redisConnection.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  return redisConnection;
};

const getRedisConnection = () => {
  if (!redisConnection) {
    return createRedisConnection();
  }
  return redisConnection;
};

module.exports = {
  createRedisConnection,
  getRedisConnection,
};

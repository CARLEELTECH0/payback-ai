const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

let autopayQueue = null;

/**
 * Initialize the autopay queue
 */
const initializeAutopayQueue = () => {
  const connection = getRedisConnection();

  autopayQueue = new Queue('autopay-scheduling', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
    },
  });

  logger.info('Autopay queue initialized');
  return autopayQueue;
};

const getAutopayQueue = () => autopayQueue;

module.exports = {
  initializeAutopayQueue,
  getAutopayQueue,
};

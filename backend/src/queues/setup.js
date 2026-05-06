const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

let paymentQueue = null;
let notificationQueue = null;
let autopayQueue = null;

const QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 25s, 125s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
};

/**
 * Initialize all queues
 */
const initializeQueues = () => {
  const connection = getRedisConnection();

  paymentQueue = new Queue('payment-processing', {
    connection,
    ...QUEUE_OPTIONS,
  });

  notificationQueue = new Queue('notifications', {
    connection,
    ...QUEUE_OPTIONS,
  });

  autopayQueue = new Queue('autopay-scheduling', {
    connection,
    ...QUEUE_OPTIONS,
  });

  logger.info('BullMQ queues initialized');

  return { paymentQueue, notificationQueue, autopayQueue };
};

const getPaymentQueue = () => paymentQueue;
const getNotificationQueue = () => notificationQueue;
const getAutopayQueue = () => autopayQueue;

module.exports = {
  initializeQueues,
  getPaymentQueue,
  getNotificationQueue,
  getAutopayQueue,
};

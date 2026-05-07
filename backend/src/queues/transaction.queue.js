const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

let transactionQueue = null;

const initializeTransactionQueue = () => {
  const connection = getRedisConnection();

  transactionQueue = new Queue('transaction-polling', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });

  logger.info('Transaction polling queue initialized');
  return transactionQueue;
};

const getTransactionQueue = () => transactionQueue;

module.exports = {
  initializeTransactionQueue,
  getTransactionQueue,
};

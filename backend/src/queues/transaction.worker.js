const { Worker, UnrecoverableError } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const db = require('../config/database');
const interswitchService = require('../modules/payment/interswitch.service');
const logger = require('../utils/logger');

let transactionWorker = null;

const initializeTransactionWorker = () => {
  const connection = getRedisConnection();

  transactionWorker = new Worker('transaction-polling', async (job) => {
    const { transactionId, reference, attempts = 0 } = job.data;
    
    logger.info(`Polling transaction status for ${reference} (Attempt: ${attempts + 1})`);
    
    try {
      // 1. Check if transaction is already in a final state
      const checkResult = await db.query(
        'SELECT status FROM transactions WHERE id = $1',
        [transactionId]
      );
      
      const currentStatus = checkResult.rows[0]?.status;
      if (!currentStatus) {
        throw new UnrecoverableError(`Transaction ${transactionId} not found`);
      }
      
      if (currentStatus === 'success' || currentStatus === 'failed' || currentStatus === 'refunded') {
        logger.info(`Transaction ${reference} is already in final state: ${currentStatus}. Skipping poll.`);
        return { status: currentStatus, skipped: true };
      }

      // 2. Query Interswitch for actual status
      const queryResponse = await interswitchService.queryTransaction(reference);
      
      const responseCode = queryResponse.ResponseCode;
      
      if (responseCode === '90000') {
        // Success
        await db.query(
          "UPDATE transactions SET status = 'success', metadata = jsonb_set(metadata, '{interswitchResponse}', $1::jsonb) WHERE id = $2",
          [JSON.stringify(queryResponse), transactionId]
        );
        logger.info(`Transaction ${reference} marked as SUCCESS.`);
        return { status: 'success' };
      } else if (['90009', '90011', '90016'].includes(responseCode)) { // known failure codes
        // Failed
        await db.query(
          "UPDATE transactions SET status = 'failed', metadata = jsonb_set(metadata, '{interswitchResponse}', $1::jsonb) WHERE id = $2",
          [JSON.stringify(queryResponse), transactionId]
        );
        logger.warn(`Transaction ${reference} marked as FAILED. Code: ${responseCode}`);
        return { status: 'failed' };
      }
      
      // If we're here, it might still be processing. 
      // If we haven't hit our retry limit, let it throw so it backs off and retries
      if (attempts < 5) {
        job.updateData({ ...job.data, attempts: attempts + 1 });
        throw new Error(`Transaction ${reference} still processing. Code: ${responseCode}`);
      } else {
        // Max attempts reached - mark as failed or pending manual review
        await db.query(
          "UPDATE transactions SET status = 'failed', metadata = jsonb_set(metadata, '{interswitchResponse}', $1::jsonb) WHERE id = $2",
          [JSON.stringify(queryResponse), transactionId]
        );
        logger.error(`Transaction ${reference} reached max poll attempts. Marked as FAILED.`);
        return { status: 'timeout' };
      }
      
    } catch (error) {
      if (error instanceof UnrecoverableError) throw error;
      
      logger.error(`Error polling transaction ${reference}:`, { error: error.message });
      throw error; // Let BullMQ handle retries
    }
  }, { connection });

  transactionWorker.on('completed', (job, returnvalue) => {
    logger.debug(`Transaction polling job ${job.id} completed.`, { returnvalue });
  });

  transactionWorker.on('failed', (job, err) => {
    logger.warn(`Transaction polling job ${job.id} failed: ${err.message}`);
  });

  logger.info('Transaction polling worker started');
  return transactionWorker;
};

const getTransactionWorker = () => transactionWorker;

module.exports = {
  initializeTransactionWorker,
  getTransactionWorker,
};

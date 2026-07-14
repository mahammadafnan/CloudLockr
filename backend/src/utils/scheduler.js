const cron = require('node-cron');
const { runProgrammaticScan } = require('./scanEngine');

/**
 * Initialize background cron job schedulers
 */
exports.startScheduler = () => {
  console.log('[Scheduler] Initializing background task schedulers...');

  // Schedule daily scan at midnight (00:00 UTC)
  // Cron syntax: minute hour day-of-month month day-of-week
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Daily cron triggered. Executing background security posture scan...');
    try {
      const scan = await runProgrammaticScan('Scheduled');
      console.log(`[Scheduler] Daily scan completed. ID: ${scan._id}. Posture Score: ${scan.score}`);
    } catch (error) {
      console.error('[Scheduler] Daily background scan failed:', error.message);
    }
  });

  console.log('[Scheduler] Daily security scanning job scheduler registered successfully. (Runs daily at 00:00 UTC)');
};

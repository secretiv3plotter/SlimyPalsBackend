const cron = require('node-cron');
const db = require('../infrastructure/db');

const initJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily summon reset...');
    try {
      await db.query('UPDATE users SET daily_summons_left = 9 WHERE deleted_at IS NULL');
      console.log('Daily summon reset complete.');
    } catch (err) {
      console.error('Error during daily summon reset:', err);
    }
  });

  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly cleanup of soft-deleted records...');
    try {
      await db.query("DELETE FROM slimes WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      await db.query("DELETE FROM friendships WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      await db.query("DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      console.log('Weekly cleanup complete.');
    } catch (err) {
      console.error('Error during weekly cleanup:', err);
    }
  });

  console.log('Background jobs initialized.');
};

module.exports = initJobs;

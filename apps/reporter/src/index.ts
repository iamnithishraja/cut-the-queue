import cron from 'node-cron';
import { generateReport } from './report';

// Run the report generation every 24 hours at midnight
// cron.schedule('0 0 * * *', async () => {
//   console.log('Starting daily report generation...');
//   try {
//     await generateReport();
//     console.log('Daily report generated successfully');
//   } catch (error) {
//     console.error('Failed to generate daily report:', error);
//   }
// });

// console.log('Reporter service started. Waiting for scheduled execution...');

async function main() {
    await generateReport();
}
main()
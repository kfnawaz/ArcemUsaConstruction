import { restoreDatabase } from './restore-database';

// Run the restore function
restoreDatabase().then(() => {
  console.log('Restore script completed!');
  process.exit(0);
}).catch(err => {
  console.error('Error in restore script:', err);
  process.exit(1);
});
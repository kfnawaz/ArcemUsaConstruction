import { useEffect } from 'react';
import fileUtils from '@/lib/fileUtils';

/**
 * Global handler component for cleaning up temporary files
 * This component should be mounted at the application root
 */
export default function GlobalCleanupHandler() {
  useEffect(() => {
    console.log('GlobalCleanupHandler: Initializing');
    
    // Run initial cleanup on startup with the correct parameter format
    fileUtils.cleanupOldFiles(3600000); // 1 hour old files
    
    // Setup periodic cleanup (every 5 minutes)
    const intervalId = setInterval(() => {
      console.log('GlobalCleanupHandler: Running periodic cleanup');
      fileUtils.cleanupOldFiles(1800000); // 30 minutes old files
    }, 300000); // Every 5 minutes (300,000 ms)
    
    // Cleanup before unmounting
    return () => {
      console.log('GlobalCleanupHandler: Shutting down');
      clearInterval(intervalId);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
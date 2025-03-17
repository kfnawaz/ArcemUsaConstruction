import { useEffect } from 'react';

/**
 * Component that handles cleaning up temporary files in Electron's Isolated Context
 * This component should be mounted at the app root level
 */
export default function ElectronCleanupHandler() {
  useEffect(() => {
    // Only run in Electron context
    const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
    if (!isElectron) return;
    
    console.log('ElectronCleanupHandler: Initializing in Electron context');
    
    // Function to clean up files
    const cleanupElectronFiles = () => {
      try {
        // Check if we have files to clean
        const filesToCleanStr = localStorage.getItem('electron_files_to_clean');
        if (!filesToCleanStr) return;
        
        const filesToClean = JSON.parse(filesToCleanStr) as string[];
        console.log('ElectronCleanupHandler: Found files to clean:', filesToClean);
        
        // If nothing to clean, stop
        if (!filesToClean || filesToClean.length === 0) {
          localStorage.removeItem('electron_files_to_clean');
          return;
        }
        
        // Try to clean files individually
        const directoryPath = '/uploads/';
        filesToClean.forEach(filename => {
          try {
            // Various methods to try to clean the file
            if ('fs' in window) {
              // @ts-ignore - Electron might expose Node.js fs module
              window.fs.unlinkSync(directoryPath + filename);
              console.log(`ElectronCleanupHandler: Deleted file via Node.js fs: ${filename}`);
            } else if ('webkitRequestFileSystem' in window) {
              // @ts-ignore - Electron may have this API
              window.webkitRequestFileSystem(
                // @ts-ignore
                window.TEMPORARY, 
                1024 * 1024, // 1MB space
                (fs: any) => {
                  fs.root.getFile(filename, {}, (fileEntry: any) => {
                    fileEntry.remove(() => {
                      console.log(`ElectronCleanupHandler: Removed file via WebKit FS: ${filename}`);
                    }, (err: any) => {
                      console.error(`Error removing file ${filename}:`, err);
                    });
                  }, (err: any) => {
                    console.log(`File not found in Electron context: ${filename}`);
                  });
                },
                (err: any) => {
                  console.error('Error accessing filesystem:', err);
                }
              );
            }
          } catch (error) {
            console.error(`ElectronCleanupHandler: Error deleting file ${filename}:`, error);
          }
        });
        
        // Clear the cleanup request after processing
        localStorage.removeItem('electron_files_to_clean');
        console.log('ElectronCleanupHandler: Cleanup completed');
      } catch (error) {
        console.error('ElectronCleanupHandler: Error during cleanup:', error);
      }
    };
    
    // Run cleanup on startup
    cleanupElectronFiles();
    
    // Add listeners to run cleanup on file change events
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'electron_cleanup_needed' || event.key === 'electron_files_to_clean') {
        console.log('ElectronCleanupHandler: Detected cleanup request via storage event');
        cleanupElectronFiles();
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Setup periodic cleanup check (every 30 seconds)
    const intervalId = setInterval(() => {
      // Check if there are any pending cleanups
      const cleanupTimeStr = localStorage.getItem('electron_cleanup_time');
      if (!cleanupTimeStr) return;
      
      const cleanupTime = parseInt(cleanupTimeStr, 10);
      const now = Date.now();
      
      // Only run if cleanup was requested in the last 5 minutes
      if (now - cleanupTime < 5 * 60 * 1000) {
        console.log('ElectronCleanupHandler: Running periodic cleanup check');
        cleanupElectronFiles();
      } else {
        // Clear old cleanup requests
        localStorage.removeItem('electron_cleanup_time');
        localStorage.removeItem('electron_files_to_clean');
      }
    }, 30000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(intervalId);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}
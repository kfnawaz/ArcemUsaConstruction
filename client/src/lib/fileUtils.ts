import { apiRequest } from './queryClient';

/**
 * Interface representing a file with its URL and original filename
 */
export interface FileEntry {
  url: string;
  filename: string;
}

/**
 * Utility functions for file management in the application
 */
export const fileUtils = {
  /**
   * Commits files that were uploaded to UploadThing
   * This associates temporary files with a specific entity in the database
   * 
   * @param sessionId A unique identifier for the form/entity session
   * @param fileUrls Optional specific file URLs to commit (if not provided, all from session are committed)
   * @returns Promise with the committed file URLs
   */
  async commitFiles(sessionId: string, fileUrls?: string[]): Promise<string[]> {
    try {
      const response = await apiRequest<{ message: string, files: string[] }>({
        url: '/api/files/commit',
        method: 'POST',
        body: { sessionId, fileUrls }
      });
      
      return response?.files || [];
    } catch (error) {
      console.error('Error committing files:', error);
      return [];
    }
  },

  /**
   * Deletes any pending/temporary files from a session
   * Used when a form is cancelled or user navigates away
   * 
   * @param sessionId The session ID to clean up
   * @param fileUrl Optional specific file URL to delete
   * @param fileUrls Optional array of file URLs to delete
   * @param cleanBrowserCache Whether to attempt cleaning browser cache as well
   * @returns Promise with the deleted file URLs
   */
  async cleanupFiles(
    sessionId: string, 
    fileUrl?: string, 
    fileUrls?: string[],
    cleanBrowserCache: boolean = true
  ): Promise<string[]> {
    try {
      console.log(`Cleaning up files for session: ${sessionId}`);
      if (fileUrl) {
        console.log(`Specific file to clean up: ${fileUrl}`);
      }
      if (fileUrls && fileUrls.length > 0) {
        console.log(`Cleaning up ${fileUrls.length} specific files`);
      }
      
      // Step 1: Clean up server-side files
      const response = await apiRequest<{ success: boolean, message: string, deletedFiles: string[], deletedCount: number }>({
        url: '/api/files/cleanup',
        method: 'POST',
        body: { sessionId, fileUrl, fileUrls }
      });
      
      const deletedFiles = response?.deletedFiles || [];
      console.log(`Server cleanup completed: ${response?.deletedCount || 0} files deleted`);
      
      // Step 2: Clean up browser cache if requested
      if (cleanBrowserCache) {
        this.cleanBrowserCachedFiles(sessionId, fileUrl, fileUrls);
      }
      
      return deletedFiles;
    } catch (error) {
      console.error('Error cleaning up files:', error);
      return [];
    }
  },
  
  /**
   * Cleans up browser-cached files and memory associated with uploads
   * This complements server-side cleanup to ensure complete file cleanup
   * 
   * @param sessionId The session ID to clean up
   * @param fileUrl Optional specific file URL to clean
   * @param fileUrls Optional array of file URLs to clean
   */
  cleanBrowserCachedFiles(
    sessionId: string,
    fileUrl?: string,
    fileUrls?: string[]
  ): void {
    // Clean up browser caches and temporary in-memory files
    console.log('Cleaning browser caches and temporary files');
    
    const filesToClean = [...(fileUrls || [])];
    if (fileUrl) {
      filesToClean.push(fileUrl);
    }
    
    // 1. Clear sessionStorage entries related to this session
    try {
      // Remove any session-specific keys from sessionStorage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes(sessionId) || key.includes('upload'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log(`Removed ${keysToRemove.length} related items from sessionStorage`);
    } catch (error) {
      console.error('Error cleaning sessionStorage:', error);
    }
    
    // 2. Clear localStorage entries related to this session
    try {
      // Remove any session-specific keys from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(sessionId) || key.includes('upload'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Removed ${keysToRemove.length} related items from localStorage`);
    } catch (error) {
      console.error('Error cleaning localStorage:', error);
    }
    
    // 3. Revoke any object URLs that might be in memory
    filesToClean.forEach(url => {
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
          console.log('Revoked object URL:', url);
        } catch (error) {
          console.error('Error revoking object URL:', error);
        }
      }
    });
    
    // 4. Clean up browser caches if possible
    if ('caches' in window) {
      try {
        // Clear any browser caches for uploads
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('upload') || cacheName.includes('files')) {
              caches.delete(cacheName);
              console.log(`Deleted cache: ${cacheName}`);
            }
          });
        });
      } catch (error) {
        console.error('Error cleaning browser caches:', error);
      }
    }
    
    // 5. Special handling for Electron Isolated Context
    this.cleanElectronIsolatedContextFiles(filesToClean);
    
    console.log('Browser cleanup completed');
  },
  
  /**
   * Special handler for cleaning up files in Electron Isolated Context
   * This is needed because Electron's isolated context maintains its own file system
   * 
   * @param fileUrls Array of file URLs that might be in the Electron context
   */
  cleanElectronIsolatedContextFiles(fileUrls: string[] = []): void {
    try {
      // Check if we're in an Electron environment
      const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
      
      if (!isElectron) {
        console.log('Not in Electron context, skipping Electron-specific cleanup');
        return;
      }
      
      console.log('Detected Electron environment, performing specialized cleanup');
      
      // Try to access the filesystem API if available
      if ('webkitRequestFileSystem' in window) {
        // @ts-ignore - Electron may have this API
        window.webkitRequestFileSystem(
          // @ts-ignore - TEMPORARY constant from Electron
          window.TEMPORARY, 
          1024 * 1024, // 1MB space
          (fs: any) => {
            console.log('Got filesystem access in Electron, cleaning temporary files');
            
            // If we have specific files to delete
            if (fileUrls.length > 0) {
              fileUrls.forEach(url => {
                try {
                  // Get just the filename from the URL
                  const filename = url.split('/').pop();
                  if (filename) {
                    fs.root.getFile(filename, {}, (fileEntry: any) => {
                      fileEntry.remove(() => {
                        console.log(`Removed Electron file: ${filename}`);
                      }, (err: any) => {
                        console.error(`Error removing Electron file ${filename}:`, err);
                      });
                    }, (err: any) => {
                      console.log(`File not found in Electron context: ${filename}`);
                    });
                  }
                } catch (error) {
                  console.error('Error parsing URL for Electron file cleanup:', error);
                }
              });
            } else {
              // If no specific files, try to clean the whole directory
              const reader = fs.root.createReader();
              reader.readEntries((entries: any[]) => {
                entries.forEach((entry) => {
                  if (entry.isFile) {
                    entry.remove(() => {
                      console.log(`Removed Electron file: ${entry.name}`);
                    }, (err: any) => {
                      console.error(`Error removing Electron file ${entry.name}:`, err);
                    });
                  }
                });
              }, (err: any) => {
                console.error('Error reading Electron directory:', err);
              });
            }
          },
          (err: any) => {
            console.error('Error accessing Electron filesystem:', err);
          }
        );
      } else {
        console.log('No filesystem API available in this Electron context');
        
        // Try to use localStorage to signal that files should be cleaned
        try {
          localStorage.setItem('electron_cleanup_needed', 'true');
          localStorage.setItem('electron_cleanup_time', Date.now().toString());
          console.log('Set cleanup flag in localStorage for Electron context');
        } catch (e) {
          console.error('Error setting cleanup flag:', e);
        }
      }
    } catch (error) {
      console.error('Error in Electron cleanup:', error);
    }
  },

  /**
   * Tracks a file that was uploaded to UploadThing
   * This keeps track of files that are not yet committed to the database
   * 
   * @param fileUrl The URL of the file to track
   * @param sessionId The session ID to associate with the file
   * @param filename Optional original filename of the file
   * @returns Promise with the tracked file URL
   */
  async trackFile(fileUrl: string, sessionId: string, filename?: string): Promise<string | null> {
    try {
      console.log(`Tracking file: ${fileUrl} for session: ${sessionId}`);
      
      // Support both old and new UploadThing URL formats
      // Ensure we're tracking the URL format that will be consistent across the application
      const urlToTrack = fileUrl;
      
      const response = await apiRequest<{ message: string, file: string, filename?: string }>({
        url: '/api/files/track',
        method: 'POST',
        body: { fileUrl: urlToTrack, sessionId, filename }
      });
      
      if (response?.file) {
        console.log(`File tracked successfully: ${response.file}`);
        return response.file;
      } else {
        console.warn(`File tracking failed for: ${fileUrl}`);
        return null;
      }
    } catch (error) {
      console.error('Error tracking file:', error);
      return null;
    }
  },

  /**
   * Generates a unique session ID for file tracking
   * Uses a combination of timestamp and random string
   * 
   * @returns A unique session ID string
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Formats a file size in bytes to a human-readable format
   * 
   * @param bytes File size in bytes
   * @param decimals Number of decimal places (default: 2)
   * @returns Formatted file size string (e.g., "1.5 MB")
   */
  formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Gets the file extension from a filename or URL
   * 
   * @param filename The filename or URL
   * @returns The file extension (e.g., "jpg")
   */
  getFileExtension(filename: string): string {
    // For UploadThing URLs, try to extract from query params or just return 'jpg' as fallback
    if (filename.includes('utfs.io') || filename.includes('ufs.sh')) {
      try {
        // Try to extract from filename in Content-Disposition header (not available client-side)
        // Or from URL query parameters if they exist
        const urlObj = new URL(filename);
        
        // Check for file extension in pathname
        const pathname = urlObj.pathname;
        const pathParts = pathname.split('.');
        if (pathParts.length > 1) {
          return pathParts[pathParts.length - 1];
        }
        
        // Extract the file ID from the path
        const fileId = pathname.split('/').pop();
        
        // Log the fileId for debugging
        console.log("UploadThing file ID:", fileId);
        
        // Default to 'jpg' for image files from UploadThing
        console.log("Using default extension for UploadThing URL:", filename);
        return 'jpg';
      } catch (error) {
        console.error("Error parsing UploadThing URL:", error);
        return 'jpg';
      }
    }
    
    // Standard method for regular filenames
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  },

  /**
   * Checks if a file is an image based on its extension
   * 
   * @param filename The filename or URL
   * @returns True if the file is an image
   */
  isImageFile(filename: string): boolean {
    // Special handling for UploadThing URLs (both old and new formats)
    if (filename.includes('utfs.io') || filename.includes('ufs.sh')) {
      console.log("Detected UploadThing URL:", filename);
      // UploadThing URLs don't always have file extensions, so we'll assume it's an image
      // This is a simplification - in a production app, you'd want to store metadata about the file type
      return true;
    }
    
    const ext = this.getFileExtension(filename).toLowerCase();
    console.log("File extension detected:", ext, "for file:", filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  },

  /**
   * Checks if a file is a document based on its extension
   * 
   * @param filename The filename or URL
   * @returns True if the file is a document
   */
  isDocumentFile(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext);
  },

  /**
   * Creates a FileEntry object from a URL and filename
   * 
   * @param url The file URL
   * @param filename The original filename
   * @returns FileEntry object
   */
  createFileEntry(url: string, filename: string): FileEntry {
    return { url, filename };
  },

  /**
   * Serializes a FileEntry to a JSON string
   * 
   * @param fileEntry FileEntry object
   * @returns JSON string
   */
  serializeFileEntry(fileEntry: FileEntry): string {
    return JSON.stringify(fileEntry);
  },

  /**
   * Parses a FileEntry from a JSON string
   * If the string is not a valid FileEntry, returns null
   * 
   * @param json JSON string
   * @returns FileEntry or null
   */
  parseFileEntry(json: string): FileEntry | null {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && 'url' in parsed && 'filename' in parsed) {
        return parsed as FileEntry;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Gets the original filename from a FileEntry or URL
   * If the input is a URL string, extracts the filename from it
   * If the input is a FileEntry, returns its filename property
   * If the input is a JSON string, parses it as a FileEntry
   * 
   * @param input FileEntry, URL string, or JSON string
   * @returns Original filename or a default value
   */
  getOriginalFilename(input: string | FileEntry): string {
    // If it's a FileEntry object
    if (typeof input === 'object' && 'filename' in input) {
      return input.filename;
    }
    
    // If it's a string, try to parse as JSON
    if (typeof input === 'string') {
      try {
        const parsed = this.parseFileEntry(input);
        if (parsed) {
          return parsed.filename;
        }
        
        // Check for UploadThing URL pattern
        if (input.includes('utfs.io/f/') || input.includes('ufs.sh/f/')) {
          // Extract file ID (last part of the URL)
          const fileId = input.split('/').pop() || '';
          return `file-${fileId.substring(0, 8)}`;
        }
        
        // Default to extracting filename from URL
        return input.split('/').pop() || 'file';
      } catch (e) {
        // Default to extracting filename from URL
        return input.split('/').pop() || 'file';
      }
    }
    
    return 'file';
  }
};
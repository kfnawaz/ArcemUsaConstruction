/**
 * Utility functions for handling files, particularly UploadThing URLs
 */

/**
 * Generate a unique session ID for file uploads
 * @returns A unique string ID
 */
export const generateSessionId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Handles UploadThing URLs consistently by detecting and using the correct format
 * prioritizing ufsUrl (new tenant format) over url (legacy format)
 * 
 * @param result The UploadThing result object with url and/or ufsUrl
 * @returns The best URL to use
 */
export const getUploadThingUrl = (result: { url?: string; ufsUrl?: string }): string | null => {
  // If we have the new ufsUrl format, use that
  if (result.ufsUrl) {
    console.log("Using ufsUrl (new UploadThing format):", result.ufsUrl);
    return result.ufsUrl;
  }
  
  // Otherwise, fall back to the legacy url
  if (result.url) {
    console.log("Using legacy url format:", result.url);
    return result.url;
  }
  
  // No valid URL found
  console.warn("No valid URL found in UploadThing result");
  return null;
};

/**
 * Extracts the best URL from an image object or fallback to a default
 * 
 * @param image The image object with imageUrl property
 * @param defaultUrl Optional default URL to use if no imageUrl is found
 * @returns The best URL to use, or defaultUrl if provided, or null
 */
export const getBestImageUrl = (
  image: { imageUrl?: string | null } | null | undefined,
  defaultUrl?: string
): string | null => {
  // If we have a valid image object with an imageUrl
  if (image && image.imageUrl) {
    // Check for the new UploadThing format (ufs.sh)
    if (image.imageUrl.includes("ufs.sh")) {
      console.log("Using UploadThing UFS URL:", image.imageUrl);
      return image.imageUrl;
    }
    
    // Check for the legacy UploadThing format (utfs.io)
    if (image.imageUrl.includes("utfs.io")) {
      console.log("Using legacy UploadThing URL:", image.imageUrl);
      return image.imageUrl;
    }
    
    // Otherwise use the standard URL
    console.log("Using standard image URL:", image.imageUrl);
    return image.imageUrl;
  }
  
  // Fall back to default if provided
  if (defaultUrl) {
    console.log("Using default image URL:", defaultUrl);
    return defaultUrl;
  }
  
  // No valid URL found
  return null;
};

/**
 * Check if a URL is an image file
 * @param url The URL to check
 * @returns True if the URL points to an image file
 */
export const isImageFile = (url: string): boolean => {
  if (!url) return false;
  
  // Check based on file extension
  const extension = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(extension.toLowerCase());
};

/**
 * Get the file extension from a URL or filename
 * @param url The URL or filename
 * @returns The file extension without the dot
 */
export const getFileExtension = (url: string): string => {
  if (!url) return '';
  
  const filename = url.split('/').pop() || '';
  const parts = filename.split('.');
  
  if (parts.length === 1) return ''; // No extension
  return parts.pop()?.toLowerCase() || '';
};

/**
 * Track a file for cleanup if needed
 * @param url The file URL
 * @param sessionId The session ID for tracking
 * @param filename Optional original filename
 */
export const trackFile = (url: string, sessionId: string, filename?: string): void => {
  try {
    // Make API request to track the file
    fetch('/api/files/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl: url,
        sessionId,
        filename
      }),
      credentials: 'include'
    }).catch(err => {
      console.error('Error tracking file:', err);
    });
  } catch (error) {
    console.error('Error tracking file:', error);
  }
};

/**
 * Cleanup old files that were uploaded but never committed to the database
 * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
 * @returns A promise that resolves when the cleanup is complete
 */
export const cleanupOldFiles = async (maxAgeMs: number = 3600000): Promise<void> => {
  try {
    console.log(`Requesting old file cleanup (older than ${maxAgeMs}ms)`);
    
    // Make API request to cleanup old files using a special case for system cleanup
    await fetch('/api/files/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        maxAgeMs,
        systemCleanup: true // Flag to indicate this is a system-wide cleanup, not a session-specific one
      }),
      credentials: 'include'
    });
    console.log('Old file cleanup requested successfully');
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

/**
 * Commit files for a specific session, marking them as used and preventing cleanup
 * @param sessionId The session ID to commit files for
 * @param fileUrls Optional array of specific file URLs to commit (if not provided, all files in the session will be committed)
 * @returns A promise that resolves with an array of committed file URLs
 */
export const commitFiles = async (sessionId: string, fileUrls?: string[]): Promise<string[]> => {
  try {
    if (!sessionId) {
      console.warn('No session ID provided for file commit');
      return [];
    }

    console.log(`Committing files for session ${sessionId}${fileUrls ? ` (${fileUrls.length} specific files)` : ''}`);
    
    const response = await fetch('/api/files/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionId,
        fileUrls
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to commit files: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Files committed successfully:', data.files || data.committedFiles || []);
    
    return data.files || data.committedFiles || [];
  } catch (error) {
    console.error('Error committing files:', error);
    return [];
  }
};

/**
 * Cleanup files for a specific session, deleting any that weren't committed
 * @param sessionId The session ID to cleanup files for
 * @param specificFileUrl Optional specific file URL to delete (if provided, only this file will be deleted)
 * @returns A promise that resolves with an array of deleted file URLs
 */
export const cleanupFiles = async (sessionId: string, specificFileUrl?: string): Promise<string[]> => {
  try {
    if (!sessionId && !specificFileUrl) {
      console.warn('No session ID or file URL provided for file cleanup');
      return [];
    }
    
    console.log(`Cleaning up files for session ${sessionId}${specificFileUrl ? ` (specific file: ${specificFileUrl})` : ''}`);
    
    const response = await fetch('/api/files/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionId,
        fileUrl: specificFileUrl
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cleanup files: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Files cleaned up successfully:', data.deletedFiles || []);
    
    return data.deletedFiles || [];
  } catch (error) {
    console.error('Error cleaning up files:', error);
    return [];
  }
};

export default {
  generateSessionId,
  formatFileSize,
  getUploadThingUrl,
  getBestImageUrl,
  isImageFile,
  getFileExtension,
  trackFile,
  cleanupOldFiles,
  commitFiles,
  cleanupFiles
};
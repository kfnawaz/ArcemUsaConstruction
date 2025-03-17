/**
 * Utility functions for file handling and uploads
 */

/**
 * Format file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string with appropriate unit (B, KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a unique session ID for tracking uploads
 * @returns A unique string ID 
 */
export function generateSessionId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a file object is an image type
 * @param file The file object to check
 * @returns True if the file is an image
 */
export function isImageFileObject(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get appropriate icon based on file type
 * @param fileType MIME type of the file
 * @returns Icon type identifier
 */
export function getFileIconType(fileType: string): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'generic' {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.includes('pdf') || 
      fileType.includes('document') || 
      fileType.includes('text/') || 
      fileType.includes('msword') ||
      fileType.includes('officedocument')) return 'document';
  if (fileType.includes('zip') || 
      fileType.includes('compressed') || 
      fileType.includes('archive')) return 'archive';
  return 'generic';
}

/**
 * Extract the filename from a URL path
 * @param url URL path
 * @returns The extracted filename
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'file';
  } catch (e) {
    // If URL parsing fails, try to extract the filename from the last segment
    const segments = url.split('/');
    return segments[segments.length - 1] || 'file';
  }
}

/**
 * Clean up files from a session on the server
 * @param sessionId Session ID to clean up
 * @param specificFileUrl Optional specific file URL to clean up
 * @returns Promise with the result of the cleanup
 */
export async function cleanupFiles(
  sessionId: string, 
  specificFileUrl?: string
): Promise<string[]> {
  try {
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
      throw new Error('Failed to cleanup uploaded files');
    }
    
    const data = await response.json();
    console.log('Cleaned up files:', data.deletedFiles);
    return data.deletedFiles || [];
  } catch (error) {
    console.error('Error cleaning up files:', error);
    return [];
  }
}

/**
 * Commit files from a session on the server (mark as permanently stored)
 * @param sessionId Session ID to commit
 * @param fileUrls Optional specific file URLs to commit
 * @returns Promise with the result of the commit
 */
export async function commitFiles(
  sessionId: string, 
  fileUrls?: string[]
): Promise<string[]> {
  try {
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
      throw new Error('Failed to commit uploaded files');
    }
    
    const data = await response.json();
    console.log('Committed files:', data.committedFiles);
    return data.committedFiles || [];
  } catch (error) {
    console.error('Error committing files:', error);
    return [];
  }
}

/**
 * Track a file in the pending files system
 * @param fileUrl URL of the file to track
 * @param sessionId Session ID for tracking
 * @param filename Optional original filename
 * @returns The tracked file URL
 */
export async function trackFile(
  fileUrl: string, 
  sessionId: string,
  filename?: string
): Promise<string> {
  try {
    const response = await fetch('/api/files/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileUrl,
        sessionId,
        filename
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to track uploaded file');
    }
    
    const data = await response.json();
    console.log('Tracked file:', data.fileUrl);
    return data.fileUrl;
  } catch (error) {
    console.error('Error tracking file:', error);
    return fileUrl; // Return the original URL as fallback
  }
}

/**
 * Extract the UploadThing key from a URL
 * @param url The file URL to extract the key from
 * @returns The file key or null if not an UploadThing URL
 */
export function extractUploadThingKeyFromUrl(url: string | null): string | null {
  if (!url) return null;
  
  // First, check if it's a UFS URL (new format)
  try {
    const ufsUrlMatch = url.match(/\/ufs\/(.+?)(?:\/|$)/);
    if (ufsUrlMatch && ufsUrlMatch[1]) {
      return ufsUrlMatch[1];
    }
    
    // Then check if it's the old format URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    
    // Old UploadThing URLs have the format /ut/.../filename or /file/something/.../filename
    // We need the key portion
    if (pathname.includes('/ut/') || pathname.includes('/file/')) {
      // Return the second-to-last segment which should be the key
      const keyIndex = segments.length - 2;
      return keyIndex >= 0 ? segments[keyIndex] : null;
    }
  } catch (e) {
    console.error('Error extracting UploadThing key from URL:', e);
  }
  
  return null;
}

/**
 * Check if a URL is an UploadThing URL
 * @param url URL to check
 * @returns True if it's an UploadThing URL
 */
export function isUploadThingUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('uploadthing') || 
           urlObj.pathname.includes('/ut/') || 
           urlObj.pathname.includes('/ufs/') ||
           urlObj.pathname.includes('/file/');
  } catch (e) {
    return false;
  }
}

/**
 * Get the file extension from a URL or filename
 * @param urlOrFilename The URL or filename to extract extension from
 * @returns The file extension without the dot, or empty string if none
 */
export function getFileExtension(urlOrFilename: string): string {
  if (!urlOrFilename) return '';
  
  try {
    // Extract the filename from URL if needed
    let filename: string;
    if (urlOrFilename.startsWith('http')) {
      // Extract filename from URL
      filename = getFilenameFromUrl(urlOrFilename);
    } else {
      filename = urlOrFilename;
    }
    
    // Get the extension
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  } catch (e) {
    console.error('Error getting file extension:', e);
  }
  
  return '';
}

/**
 * Check if a URL or filename is an image file based on extension
 * @param urlOrFilename The URL or filename to check
 * @returns True if it's an image file
 */
export function isImageFile(urlOrFilename: string): boolean {
  const extension = getFileExtension(urlOrFilename);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  return imageExtensions.includes(extension.toLowerCase());
}

/**
 * Clean up old pending files from the server
 * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
 * @returns Promise with the number of files cleaned up
 */
export async function cleanupOldFiles(maxAgeMs: number = 3600000): Promise<number> {
  try {
    const response = await fetch('/api/files/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxAgeMs }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to cleanup old files');
    }
    
    const data = await response.json();
    console.log('Cleaned up old files:', data.deletedCount);
    return data.deletedCount || 0;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return 0;
  }
}
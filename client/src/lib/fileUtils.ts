/**
 * Utility functions for file handling
 */

/**
 * Generate a unique session ID for tracking file uploads
 * @returns A unique string ID
 */
export function generateSessionId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

/**
 * Cleanup old pending file uploads
 * This is called by the GlobalCleanupHandler component
 * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupOldFiles(maxAgeMs: number = 3600000): Promise<void> {
  try {
    // Call the server API to clean up old pending files
    const response = await fetch('/api/files/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxAge: maxAgeMs }),
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.deletedCount > 0) {
        console.log(`Cleaned up ${data.deletedCount} old pending files`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}

/**
 * Format file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a file is an image based on its MIME type
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get the file extension from a file name
 * @param fileName The file name
 * @returns The file extension (e.g., "jpg")
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Generate a random file name while preserving the extension
 * @param originalName The original file name
 * @returns A new random file name with the same extension
 */
export function generateRandomFileName(originalName: string): string {
  const extension = getFileExtension(originalName);
  const randomName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  return extension ? `${randomName}.${extension}` : randomName;
}

/**
 * Check if a URL is an UploadThing URL
 * @param url The URL to check
 * @returns Boolean indicating if the URL is from UploadThing
 */
export function isUploadThingUrl(url: string): boolean {
  return url.includes('uploadthing.com') || url.includes('utfs.io');
}

/**
 * Extract key from an UploadThing URL
 * @param url The UploadThing URL
 * @returns The file key or null if not an UploadThing URL
 */
export function extractUploadThingKey(url: string): string | null {
  if (!isUploadThingUrl(url)) return null;
  
  // Handle both old and new URL formats
  if (url.includes('utfs.io')) {
    // New URL format: https://utfs.io/f/{key}
    const match = url.match(/\/f\/([^/?#]+)/);
    return match ? match[1] : null;
  } else {
    // Old URL format: https://uploadthing.com/f/{key}
    const match = url.match(/\/f\/([^/?#]+)/);
    return match ? match[1] : null;
  }
}
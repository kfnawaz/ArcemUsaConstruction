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

export default {
  generateSessionId,
  formatFileSize,
  getUploadThingUrl,
  getBestImageUrl,
  isImageFile,
  getFileExtension,
  trackFile
};
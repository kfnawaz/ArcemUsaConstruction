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
   * @returns Promise with the deleted file URLs
   */
  async cleanupFiles(
    sessionId: string, 
    fileUrl?: string, 
    fileUrls?: string[]
  ): Promise<string[]> {
    try {
      console.log(`Cleaning up files for session: ${sessionId}`);
      if (fileUrl) {
        console.log(`Specific file to clean up: ${fileUrl}`);
      }
      if (fileUrls && fileUrls.length > 0) {
        console.log(`Cleaning up ${fileUrls.length} specific files`);
      }
      
      const response = await apiRequest<{ message: string, deletedFiles: string[] }>({
        url: '/api/files/cleanup',
        method: 'POST',
        body: { sessionId, fileUrl, fileUrls }
      });
      
      if (response?.deletedFiles) {
        console.log(`Successfully cleaned up ${response.deletedFiles.length} files`);
        return response.deletedFiles;
      } else {
        console.log('No files were cleaned up or response format was unexpected');
        return [];
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
      return [];
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
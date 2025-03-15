import fs from 'fs';
import path from 'path';
import { log } from '../vite';

interface PendingFile {
  url: string;
  timestamp: number;
  sessionId: string;
}

/**
 * Manages file operations for the application, including deletion and tracking
 */
export class FileManager {
  // In-memory store of pending files that haven't been committed to database records
  private static pendingFiles: Map<string, PendingFile> = new Map();
  
  /**
   * Tracks a newly uploaded file that hasn't been saved to the database yet
   * @param fileUrl The URL of the uploaded file
   * @param sessionId A unique identifier for the upload session (form instance)
   * @returns The tracked file URL
   */
  static trackPendingFile(fileUrl: string, sessionId: string): string {
    if (!fileUrl) return fileUrl;
    
    // Skip external URLs
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    // Add to pending files map
    this.pendingFiles.set(fileUrl, {
      url: fileUrl,
      timestamp: Date.now(),
      sessionId
    });
    
    log(`Tracking pending file: ${fileUrl} for session ${sessionId}`, 'file-manager');
    
    return fileUrl;
  }
  
  /**
   * Marks files from a session as permanent (committed to database)
   * @param sessionId The session ID to commit
   * @param fileUrls Optional array of specific file URLs to commit
   * @returns Array of committed file URLs
   */
  static commitFiles(sessionId: string, fileUrls?: string[]): string[] {
    const committedFiles: string[] = [];
    
    if (fileUrls && fileUrls.length > 0) {
      // Commit specific files
      fileUrls.forEach(url => {
        if (this.pendingFiles.has(url)) {
          const file = this.pendingFiles.get(url)!;
          if (file.sessionId === sessionId) {
            this.pendingFiles.delete(url);
            committedFiles.push(url);
          }
        }
      });
    } else {
      // Commit all files for this session
      this.pendingFiles.forEach((file, url) => {
        if (file.sessionId === sessionId) {
          this.pendingFiles.delete(url);
          committedFiles.push(url);
        }
      });
    }
    
    log(`Committed ${committedFiles.length} files for session ${sessionId}`, 'file-manager');
    return committedFiles;
  }
  
  /**
   * Deletes all pending files for a session (when form is cancelled)
   * @param sessionId The session ID to cleanup
   * @param specificFileUrl Optional specific file URL to delete from the session
   * @returns Array of deleted file URLs
   */
  static async cleanupSession(sessionId: string, specificFileUrl?: string): Promise<string[]> {
    const filesToDelete: string[] = [];
    
    // If a specific file URL was provided, only delete that one
    if (specificFileUrl) {
      // Check if this file exists in our tracking
      const pendingFile = this.pendingFiles.get(specificFileUrl);
      
      if (pendingFile) {
        // Only delete if it matches the session or no session was specified
        if (sessionId === '*' || pendingFile.sessionId === sessionId) {
          filesToDelete.push(specificFileUrl);
        }
      } else {
        // File not tracked, but attempt to delete anyway if it appears 
        // to be a local upload (for backwards compatibility)
        if (specificFileUrl.startsWith('/uploads/')) {
          filesToDelete.push(specificFileUrl);
        }
      }
    } else {
      // Find all files for this session
      this.pendingFiles.forEach((file, url) => {
        if (file.sessionId === sessionId) {
          filesToDelete.push(url);
        }
      });
    }
    
    // Delete each file
    const deletedFiles: string[] = [];
    for (const url of filesToDelete) {
      const deleted = await this.deleteFile(url);
      if (deleted) {
        this.pendingFiles.delete(url);
        deletedFiles.push(url);
      }
    }
    
    const logMessage = specificFileUrl 
      ? `Deleted file ${specificFileUrl}` 
      : `Cleaned up ${deletedFiles.length} files for session ${sessionId}`;
    
    log(logMessage, 'file-manager');
    return deletedFiles;
  }
  
  /**
   * Cleans up old pending files that are older than the specified age
   * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
   * @returns Number of files cleaned up
   */
  static async cleanupOldPendingFiles(maxAgeMs: number = 3600000): Promise<number> {
    const now = Date.now();
    const filesToDelete: string[] = [];
    
    // Find old files
    this.pendingFiles.forEach((file, url) => {
      if (now - file.timestamp > maxAgeMs) {
        filesToDelete.push(url);
      }
    });
    
    // Delete each file
    let deletedCount = 0;
    for (const url of filesToDelete) {
      const deleted = await this.deleteFile(url);
      if (deleted) {
        this.pendingFiles.delete(url);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      log(`Cleaned up ${deletedCount} old pending files`, 'file-manager');
    }
    
    return deletedCount;
  }

  /**
   * Deletes a file from the uploads directory
   * @param fileUrl The URL of the file to delete (e.g., '/uploads/filename.jpg')
   * @returns Promise<boolean> True if the file was deleted, false otherwise
   */
  static async deleteFile(fileUrl: string | null): Promise<boolean> {
    if (!fileUrl) return false;
    
    try {
      // Skip deletion for external URLs (starting with http or https)
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        log(`Skipping deletion of external file: ${fileUrl}`, 'file-manager');
        return false;
      }

      // Ensure we're only targeting files in the uploads directory
      if (!fileUrl.includes('/uploads/')) {
        log(`Attempted to delete file outside uploads directory: ${fileUrl}`, 'file-manager');
        return false;
      }

      // Create the full path to the file
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, fileUrl);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        log(`File not found: ${filePath}`, 'file-manager');
        return false;
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      // If the file was in our pending files map, remove it
      if (this.pendingFiles.has(fileUrl)) {
        this.pendingFiles.delete(fileUrl);
      }
      
      log(`Successfully deleted file: ${filePath}`, 'file-manager');
      return true;
    } catch (error) {
      log(`Error deleting file ${fileUrl}: ${error}`, 'file-manager');
      return false;
    }
  }

  /**
   * Safely deletes a file, checking for references in other entities
   * In the future, this could be extended to check for file usage across the system
   * @param fileUrl The URL of the file to delete
   * @returns Promise<boolean> True if the file was deleted, false otherwise
   */
  static async safeDeleteFile(fileUrl: string | null): Promise<boolean> {
    // For now, we're just calling deleteFile
    // In the future, we should check if the file is used by other entities
    return await FileManager.deleteFile(fileUrl);
  }
}
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

interface PendingFile {
  url: string;
  timestamp: number;
  sessionId: string;
}

/**
 * Manages file operations for the application, including deletion and tracking
 */
export class FileManager {
  // Track files that are uploaded but not yet saved to the database
  private static pendingFiles: Map<string, PendingFile> = new Map();

  /**
   * Tracks a newly uploaded file that hasn't been saved to the database yet
   * @param fileUrl The URL of the uploaded file
   * @param sessionId A unique identifier for the upload session (form instance)
   * @returns The tracked file URL
   */
  static trackPendingFile(fileUrl: string, sessionId: string): string {
    const key = fileUrl;
    this.pendingFiles.set(key, {
      url: fileUrl,
      timestamp: Date.now(),
      sessionId
    });
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
    
    // Iterate through all pending files
    for (const entry of Array.from(this.pendingFiles.entries())) {
      const [key, pendingFile] = entry;
      // If file belongs to this session and is in the list to commit (or no list provided)
      if (pendingFile.sessionId === sessionId && 
          (!fileUrls || fileUrls.includes(pendingFile.url))) {
        // Remove from pending files since it's now committed
        this.pendingFiles.delete(key);
        committedFiles.push(pendingFile.url);
      }
    }
    
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
    const keysToDelete: string[] = [];
    
    // Find files for deletion
    for (const entry of Array.from(this.pendingFiles.entries())) {
      const [key, pendingFile] = entry;
      if (pendingFile.sessionId === sessionId && 
          (!specificFileUrl || pendingFile.url === specificFileUrl)) {
        filesToDelete.push(pendingFile.url);
        keysToDelete.push(key);
      }
    }
    
    // Delete files physically if they're from UploadThing
    const deletedUrls: string[] = [];
    for (const fileUrl of filesToDelete) {
      try {
        // For UploadThing, we don't need to physically delete the file
        // as it's managed by their service
        deletedUrls.push(fileUrl);
      } catch (error) {
        console.error(`Error deleting file ${fileUrl}:`, error);
      }
    }
    
    // Remove tracking entries
    for (const key of keysToDelete) {
      this.pendingFiles.delete(key);
    }
    
    return deletedUrls;
  }

  /**
   * Cleans up old pending files that are older than the specified age
   * @param maxAgeMs Maximum age in milliseconds (default: 1 hour)
   * @returns Number of files cleaned up
   */
  static async cleanupOldPendingFiles(maxAgeMs: number = 3600000): Promise<number> {
    const now = Date.now();
    const oldSessionIds = new Set<string>();
    
    // Identify old sessions
    for (const entry of Array.from(this.pendingFiles.entries())) {
      const [key, pendingFile] = entry;
      if (now - pendingFile.timestamp > maxAgeMs) {
        oldSessionIds.add(pendingFile.sessionId);
      }
    }
    
    // Clean up each old session
    let totalCleaned = 0;
    for (const sessionId of Array.from(oldSessionIds)) {
      const cleanedFiles = await this.cleanupSession(sessionId);
      totalCleaned += cleanedFiles.length;
    }
    
    return totalCleaned;
  }

  /**
   * Deletes a file from the uploads directory
   * @param fileUrl The URL of the file to delete (e.g., '/uploads/filename.jpg')
   * @returns Promise<boolean> True if the file was deleted, false otherwise
   */
  static async deleteFile(fileUrl: string | null): Promise<boolean> {
    if (!fileUrl) return false;
    
    try {
      // For UploadThing files, we can't physically delete them this way
      // We would need to use their API to delete files
      
      // But for locally uploaded files, we can delete them like this:
      if (fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', fileUrl);
        if (await exists(filePath)) {
          await unlink(filePath);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error deleting file ${fileUrl}:`, error);
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
    if (!fileUrl) return false;
    
    try {
      // Here we would check if the file is used elsewhere in the system
      // For now, we'll just delete it directly
      return await this.deleteFile(fileUrl);
    } catch (error) {
      console.error(`Error safely deleting file ${fileUrl}:`, error);
      return false;
    }
  }
}
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { uploadThingService } from '../services/uploadthingService';

const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

/**
 * Extract the UploadThing file key from a URL
 * @param url The file URL to extract the key from
 * @returns The file key or null if not an UploadThing URL
 */
export function extractUploadThingKeyFromUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Check if this is an UploadThing URL
  if (url.includes('utfs.io/f/') || url.includes('ufs.sh/f/')) {
    // Extract the key from the URL
    // Format: https://utfs.io/f/{key} or https://{tenant}.ufs.sh/f/{key}
    const parts = url.split('/f/');
    if (parts.length === 2) {
      return parts[1];
    }
  }
  
  return null;
}

interface PendingFile {
  url: string;
  timestamp: number;
  sessionId: string;
  filename?: string; // Original filename
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
   * @param filename Optional original filename of the uploaded file
   * @returns The tracked file URL
   */
  static trackPendingFile(fileUrl: string, sessionId: string, filename?: string): string {
    const key = fileUrl;
    
    // Check if this URL is already tracked for this session to avoid duplicates
    const existing = Array.from(this.pendingFiles.entries())
      .find(([_, file]) => file.url === fileUrl && file.sessionId === sessionId);
    
    if (!existing) {
      console.log(`Tracking new pending file: ${fileUrl} for session ${sessionId}`);
      this.pendingFiles.set(key, {
        url: fileUrl,
        timestamp: Date.now(),
        sessionId,
        filename
      });
    } else {
      console.log(`File already tracked: ${fileUrl} for session ${sessionId}`);
    }
    
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
    console.log(`Cleaning up session ${sessionId}${specificFileUrl ? ` (specific file: ${specificFileUrl})` : ''}`);
    
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
    
    console.log(`Found ${filesToDelete.length} files to delete for session ${sessionId}`);
    
    // Delete files from their storage locations
    const deletedUrls: string[] = [];
    for (const fileUrl of filesToDelete) {
      try {
        // Check if this is an UploadThing file and delete it
        const uploadThingKey = extractUploadThingKeyFromUrl(fileUrl);
        
        if (uploadThingKey) {
          console.log(`Deleting UploadThing file with key: ${uploadThingKey}`);
          
          try {
            const result = await uploadThingService.deleteFile(uploadThingKey);
            if (result.success) {
              console.log(`Successfully deleted UploadThing file: ${uploadThingKey}`);
              deletedUrls.push(fileUrl);
            } else {
              console.log(`Failed to delete UploadThing file: ${uploadThingKey}`);
            }
          } catch (err) {
            console.error(`Error deleting UploadThing file with key ${uploadThingKey}:`, err);
          }
        } 
        // For local files in the filesystem
        else if (fileUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', fileUrl);
          if (await exists(filePath)) {
            await unlink(filePath);
            console.log(`Deleted local file: ${filePath}`);
            deletedUrls.push(fileUrl);
          }
        } 
        else {
          console.log(`Unknown file format, can't delete: ${fileUrl}`);
          // Still mark it as deleted for tracking purposes
          deletedUrls.push(fileUrl);
        }
      } catch (error) {
        console.error(`Error deleting file ${fileUrl}:`, error);
      }
    }
    
    // Remove tracking entries
    for (const key of keysToDelete) {
      this.pendingFiles.delete(key);
    }
    
    console.log(`Cleanup completed: ${deletedUrls.length} files deleted for session ${sessionId}`);
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
   * Deletes a file from storage (local filesystem or UploadThing)
   * @param fileUrl The URL of the file to delete
   * @returns Promise<boolean> True if the file was deleted, false otherwise
   */
  static async deleteFile(fileUrl: string | null): Promise<boolean> {
    if (!fileUrl) return false;
    
    try {
      // Check if this is an UploadThing file
      const uploadThingKey = extractUploadThingKeyFromUrl(fileUrl);
      if (uploadThingKey) {
        // Delete from UploadThing using their API
        console.log(`Deleting UploadThing file with key: ${uploadThingKey}`);
        try {
          const result = await uploadThingService.deleteFile(uploadThingKey);
          return result.success;
        } catch (err) {
          console.error(`Error deleting UploadThing file with key ${uploadThingKey}:`, err);
          // Continue execution even if UploadThing fails - it might be a temporary issue
          // and we don't want to block database cleanup
          return false;
        }
      }
      
      // For locally uploaded files, delete them from the filesystem
      if (fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', fileUrl);
        if (await exists(filePath)) {
          await unlink(filePath);
          return true;
        }
      }
      
      // If we reach here, either the file doesn't exist or it's not in a recognized format
      console.log(`File not found or in unrecognized format: ${fileUrl}`);
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
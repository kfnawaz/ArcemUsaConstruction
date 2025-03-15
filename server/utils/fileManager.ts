import fs from 'fs';
import path from 'path';
import { log } from '../vite';

/**
 * Manages file operations for the application, including deletion and tracking
 */
export class FileManager {
  /**
   * Deletes a file from the uploads directory
   * @param fileUrl The URL of the file to delete (e.g., '/uploads/filename.jpg')
   * @returns Promise<boolean> True if the file was deleted, false otherwise
   */
  static async deleteFile(fileUrl: string | null): Promise<boolean> {
    if (!fileUrl) return false;
    
    try {
      // Extract the filename from the URL
      // URLs are typically in the format /uploads/filename.jpg
      
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
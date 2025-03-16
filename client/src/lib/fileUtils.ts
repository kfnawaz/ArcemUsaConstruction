import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

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
      const result = await apiRequest<{ files: string[] }>('/api/files/commit', {
        method: 'POST',
        data: {
          sessionId,
          fileUrls
        }
      });
      
      return result?.files || [];
    } catch (error) {
      console.error('Error committing files:', error);
      throw error;
    }
  },
  
  /**
   * Deletes any pending/temporary files from a session
   * Used when a form is cancelled or user navigates away
   * 
   * @param sessionId The session ID to clean up
   * @param fileUrl Optional specific file URL to delete
   * @returns Promise with the deleted file URLs
   */
  async cleanupFiles(sessionId: string, fileUrl?: string): Promise<string[]> {
    try {
      const result = await apiRequest<{ deleted: string[] }>('/api/files/cleanup', {
        method: 'POST',
        data: {
          sessionId,
          fileUrl
        }
      });
      
      return result?.deleted || [];
    } catch (error) {
      console.error('Error cleaning up files:', error);
      throw error;
    }
  },
  
  /**
   * Generates a unique session ID for file tracking
   * Uses a combination of timestamp and random string
   * 
   * @returns A unique session ID string
   */
  generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  },
  
  /**
   * Formats a file size in bytes to a human-readable format
   * 
   * @param bytes File size in bytes
   * @param decimals Number of decimal places (default: 2)
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  
  /**
   * Determines if a file is an image based on its URL or name
   * 
   * @param fileUrl The file URL or name
   * @returns Boolean indicating if the file is an image
   */
  isImageFile(fileUrl: string): boolean {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  },
  
  /**
   * Get a file's name from its URL
   * 
   * @param fileUrl The file URL
   * @returns The file name
   */
  getFileName(fileUrl: string): string {
    return fileUrl.split('/').pop() || fileUrl;
  }
};

/**
 * React hook for managing file operations with toast notifications
 */
export function useFileManager() {
  const { toast } = useToast();
  
  /**
   * Commit files with toast notifications
   */
  const commitFiles = async (sessionId: string, fileUrls?: string[]): Promise<string[]> => {
    try {
      const committed = await fileUtils.commitFiles(sessionId, fileUrls);
      
      if (committed.length > 0) {
        toast({
          title: 'Files saved',
          description: `${committed.length} files have been successfully saved.`,
        });
      }
      
      return committed;
    } catch (error) {
      toast({
        title: 'Error saving files',
        description: (error as Error)?.message || 'There was a problem saving your files.',
        variant: 'destructive',
      });
      
      throw error;
    }
  };
  
  /**
   * Clean up files with toast notifications
   */
  const cleanupFiles = async (sessionId: string, fileUrl?: string): Promise<string[]> => {
    try {
      const deleted = await fileUtils.cleanupFiles(sessionId, fileUrl);
      
      if (deleted.length > 0 && !fileUrl) {
        toast({
          title: 'Temporary files removed',
          description: `${deleted.length} unused files have been cleaned up.`,
        });
      }
      
      return deleted;
    } catch (error) {
      // Only show error toast if explicitly deleting a file, not on auto-cleanup
      if (fileUrl) {
        toast({
          title: 'Error removing file',
          description: (error as Error)?.message || 'There was a problem removing your file.',
          variant: 'destructive',
        });
      }
      
      throw error;
    }
  };
  
  return {
    commitFiles,
    cleanupFiles,
    generateSessionId: fileUtils.generateSessionId,
    formatFileSize: fileUtils.formatFileSize,
    isImageFile: fileUtils.isImageFile,
    getFileName: fileUtils.getFileName,
  };
}
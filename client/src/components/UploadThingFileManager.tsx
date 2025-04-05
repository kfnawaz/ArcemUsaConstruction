import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  FileIcon, 
  FilePenIcon, 
  Image, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  FolderIcon
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';

// Interface for files returned from the API
export interface FileListItem {
  key: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
  category?: string; // Category for organizing files (projects, quotes, etc.)
}

// Response from delete batch endpoint
interface DeleteBatchResponse {
  message: string;
  deletedCount: number;
}

// Response from delete file endpoint
interface DeleteFileResponse {
  message: string;
}

export default function UploadThingFileManager() {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileListItem | null>(null);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching files
  const { 
    data: filesData = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery<FileListItem[]>({
    queryKey: ['/api/uploadthing/files'],
    queryFn: async () => {
      const response = await axios.get('/api/uploadthing/files');
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Safe access to files data
  const files = Array.isArray(filesData) ? filesData : [];

  // Clean up selected files if they no longer exist
  useEffect(() => {
    if (files.length > 0) {
      const fileKeys = new Set(files.map(file => file.key));
      const selectedFilesArray = Array.from(selectedFiles);
      const newSelectedFiles = new Set(selectedFilesArray.filter(key => fileKeys.has(key)));
      if (newSelectedFiles.size !== selectedFiles.size) {
        setSelectedFiles(newSelectedFiles);
      }
    }
  }, [files, selectedFiles]);

  // Mutation for deleting a file
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await axios.delete<DeleteFileResponse>(`/api/uploadthing/files/${key}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploadthing/files'] });
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.',
      });
      setFileToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete file',
        description: error?.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Mutation for batch deleting files
  const batchDeleteMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      const response = await axios.post<DeleteBatchResponse>('/api/uploadthing/files/delete-batch', { keys });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploadthing/files'] });
      toast({
        title: 'Files deleted',
        description: `${data.deletedCount} files have been successfully deleted.`,
      });
      setSelectedFiles(new Set());
      setIsBatchDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete files',
        description: error?.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle selecting/deselecting individual file
  const toggleSelectFile = (key: string) => {
    const newSelectedFiles = new Set(Array.from(selectedFiles));
    if (newSelectedFiles.has(key)) {
      newSelectedFiles.delete(key);
    } else {
      newSelectedFiles.add(key);
    }
    setSelectedFiles(newSelectedFiles);
  };

  // Handle selecting/deselecting all files
  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(file => file.key)));
    }
  };

  // Handle selecting/deselecting files in a category
  const toggleSelectCategory = (categoryFiles: FileListItem[]) => {
    const categoryKeys = categoryFiles.map(file => file.key);
    const allSelected = categoryFiles.every(file => selectedFiles.has(file.key));
    
    const newSelectedFiles = new Set(Array.from(selectedFiles));
    
    if (allSelected) {
      // Deselect all files in this category
      categoryKeys.forEach(key => newSelectedFiles.delete(key));
    } else {
      // Select all files in this category
      categoryKeys.forEach(key => newSelectedFiles.add(key));
    }
    
    setSelectedFiles(newSelectedFiles);
  };

  // Handle initiating delete for a single file
  const handleDeleteFile = (file: FileListItem) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  // Handle initiating batch delete
  const handleBatchDelete = () => {
    if (selectedFiles.size === 0) return;
    setIsBatchDeleteDialogOpen(true);
  };

  // Handle confirming delete for a single file
  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.key);
    }
  };

  // Handle confirming batch delete
  const confirmBatchDelete = () => {
    if (selectedFiles.size > 0) {
      batchDeleteMutation.mutate(Array.from(selectedFiles));
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Determine file icon based on filename
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FilePenIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  // Parse category path for hierarchical display
  const parseCategoryPath = (path: string): { main: string, sub: string | null } => {
    if (!path) return { main: 'Other', sub: null };
    const parts = path.split('/');
    return {
      main: parts[0],
      sub: parts.length > 1 ? parts.slice(1).join('/') : null
    };
  };

  // Group files by category
  const groupFilesByCategory = () => {
    const categorized: Record<string, FileListItem[]> = {};
    
    files.forEach(file => {
      const category = file.category || 'Other';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(file);
    });
    
    return categorized;
  };

  // Get main categories and their subcategories
  const getOrganizedCategories = () => {
    const filesByCategory = groupFilesByCategory();
    const categories = Object.keys(filesByCategory);
    
    // Group by main categories
    const mainCategories: Record<string, string[]> = {};
    const mainCategoryFiles: Record<string, FileListItem[]> = {};
    
    // Initialize for Projects since we want it to appear first even if empty
    mainCategories['Projects'] = [];
    mainCategoryFiles['Projects'] = [];
    
    categories.forEach(category => {
      const { main, sub } = parseCategoryPath(category);
      
      if (!mainCategories[main]) {
        mainCategories[main] = [];
        mainCategoryFiles[main] = [];
      }
      
      if (sub) {
        // Add as subcategory
        if (!mainCategories[main].includes(category)) {
          mainCategories[main].push(category);
        }
        
        // Make sure subcategory files are available
        if (!filesByCategory[category]) {
          filesByCategory[category] = [];
        }
      } else {
        // Add files directly to main category
        mainCategoryFiles[main] = filesByCategory[category];
      }
    });
    
    // Sort subcategories within each main category
    Object.keys(mainCategories).forEach(main => {
      mainCategories[main].sort((a, b) => {
        // Extract just the subcategory name without the main category prefix
        const aName = a.replace(`${main}/`, '');
        const bName = b.replace(`${main}/`, '');
        
        // 'Other Projects' should come last
        if (aName.includes('Other')) return 1;
        if (bName.includes('Other')) return -1;
        
        return aName.localeCompare(bName);
      });
    });
    
    return {
      mainCategories,
      mainCategoryFiles,
      filesByCategory
    };
  };

  // Render placeholder loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="border rounded-md">
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading files</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'An unknown error occurred while fetching files.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTitle>No files found</AlertTitle>
            <AlertDescription>
              There are no files stored in your UploadThing account. Upload a file to get started.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Get organized categories and files
  const { mainCategories, mainCategoryFiles, filesByCategory } = getOrganizedCategories();
  
  // Custom sorting for main categories: 
  // Projects first, Other last, everything else alphabetically
  const sortedMainCategories = Object.keys(mainCategories).sort((a, b) => {
    // Projects category always first
    if (a === 'Projects') return -1;
    if (b === 'Projects') return 1;
    
    // Other category always last
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    
    // Custom category order for known categories
    const categoryOrder = {
      'Quote Requests': 2,
      'Services': 3,
      'Blog': 4,
      'Team Members': 5,
      'Brand Assets': 6,
      'Documents': 7,
      'Legal Documents': 8
    };
    
    // Get the order for each category (or a high number if not in the list)
    const orderA = categoryOrder[a] || 100;
    const orderB = categoryOrder[b] || 100;
    
    // Sort by the predefined order
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If same order (or both not in the list), sort alphabetically
    return a.localeCompare(b);
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">UploadThing Files</h2>
          <Button 
            variant="destructive" 
            disabled={selectedFiles.size === 0 || batchDeleteMutation.isPending} 
            onClick={handleBatchDelete}
          >
            Delete Selected ({selectedFiles.size})
          </Button>
        </div>

        <div className="border rounded-md p-4">
          {/* Folder-based organization */}
          {sortedMainCategories.map(mainCategory => {
            const isMainExpanded = expandedCategories[mainCategory] || false;
            const subCategories = mainCategories[mainCategory];
            const mainFiles = mainCategoryFiles[mainCategory] || [];
            const hasFiles = mainFiles.length > 0;
            const hasSubcategories = subCategories.length > 0;
            
            return (
              <div key={mainCategory} className="mb-4">
                {/* Main Category Folder */}
                <div 
                  className="flex items-center gap-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors" 
                  onClick={() => toggleCategory(mainCategory)}
                >
                  {isMainExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <FolderIcon className="h-5 w-5 text-blue-500" />
                  <div className="font-semibold flex-1">{mainCategory}</div>
                  <span className="text-sm text-gray-500">
                    {hasFiles ? `${mainFiles.length} files` : ''}
                    {hasFiles && hasSubcategories ? ' + ' : ''}
                    {hasSubcategories ? `${subCategories.length} subfolder${subCategories.length !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                
                {/* Main Category Files - show when expanded */}
                {isMainExpanded && hasFiles && (
                  <div className="ml-8 mt-2 mb-4">
                    <div className="bg-white border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox 
                                checked={mainFiles.length > 0 && mainFiles.every(file => selectedFiles.has(file.key))} 
                                onCheckedChange={() => toggleSelectCategory(mainFiles)}
                                aria-label={`Select all files in ${mainCategory}`}
                              />
                            </TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="w-14">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mainFiles.map((file) => (
                            <TableRow key={file.key}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedFiles.has(file.key)} 
                                  onCheckedChange={() => toggleSelectFile(file.key)}
                                  aria-label={`Select file ${file.name}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file.name)}
                                  <a 
                                    href={file.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {file.name}
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell>{file.name.split('.').pop()?.toUpperCase() || 'Unknown'}</TableCell>
                              <TableCell>{formatBytes(file.size)}</TableCell>
                              <TableCell>{formatDate(new Date(file.uploadedAt))}</TableCell>
                              <TableCell>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteFile(file)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {/* Subcategories */}
                {isMainExpanded && hasSubcategories && (
                  <div className="ml-8 space-y-3">
                    {subCategories.map(subCategoryPath => {
                      const { sub } = parseCategoryPath(subCategoryPath);
                      if (!sub) return null;
                      
                      const isSubExpanded = expandedCategories[subCategoryPath] || false;
                      const subFiles = filesByCategory[subCategoryPath] || [];
                      
                      return (
                        <div key={subCategoryPath} className="mt-2">
                          {/* Subcategory Folder */}
                          <div 
                            className="flex items-center gap-2 p-2 bg-gray-50 border rounded cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => toggleCategory(subCategoryPath)}
                          >
                            {isSubExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )}
                            <FolderIcon className="h-5 w-5 text-yellow-500" />
                            <div className="font-medium flex-1">{sub}</div>
                            <span className="text-sm text-gray-500">
                              {subFiles.length} file{subFiles.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {/* Subcategory Files */}
                          {isSubExpanded && (
                            <div className="ml-8 mt-2">
                              <div className="bg-white border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">
                                        <Checkbox 
                                          checked={subFiles.length > 0 && subFiles.every(file => selectedFiles.has(file.key))} 
                                          onCheckedChange={() => toggleSelectCategory(subFiles)}
                                          aria-label={`Select all files in ${sub}`}
                                        />
                                      </TableHead>
                                      <TableHead>File Name</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Size</TableHead>
                                      <TableHead>Uploaded</TableHead>
                                      <TableHead className="w-14">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {subFiles.map((file) => (
                                      <TableRow key={file.key}>
                                        <TableCell>
                                          <Checkbox 
                                            checked={selectedFiles.has(file.key)} 
                                            onCheckedChange={() => toggleSelectFile(file.key)}
                                            aria-label={`Select file ${file.name}`}
                                          />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                            {getFileIcon(file.name)}
                                            <a 
                                              href={file.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {file.name}
                                            </a>
                                          </div>
                                        </TableCell>
                                        <TableCell>{file.name.split('.').pop()?.toUpperCase() || 'Unknown'}</TableCell>
                                        <TableCell>{formatBytes(file.size)}</TableCell>
                                        <TableCell>{formatDate(new Date(file.uploadedAt))}</TableCell>
                                        <TableCell>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            onClick={() => handleDeleteFile(file)}
                                            disabled={deleteMutation.isPending}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Single File Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteFile}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Delete Dialog */}
        <Dialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Multiple Files</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedFiles.size} selected files? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBatchDeleteDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={confirmBatchDelete}
                disabled={batchDeleteMutation.isPending}
              >
                {batchDeleteMutation.isPending ? 'Deleting...' : 'Delete Files'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
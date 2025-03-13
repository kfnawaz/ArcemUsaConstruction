import { useState } from 'react';
import { 
  DownloadIcon, 
  FileText, 
  FileSpreadsheet, 
  FileX2, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project } from '@shared/schema';
import { exportMultipleProjects, ExportFormat } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ProjectsExportOptionsProps {
  projects: Project[];
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
  compact?: boolean;
}

const ProjectsExportOptions = ({ 
  projects, 
  buttonText = 'Export All Projects', 
  variant = 'outline',
  showIcon = true,
  compact = false
}: ProjectsExportOptionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<ExportFormat | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    if (!projects || projects.length === 0) {
      toast({
        title: "Export Failed",
        description: "No projects available to export.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsExporting(true);
      setCurrentFormat(format);
      
      // Perform the export
      exportMultipleProjects(projects, format);
      
      // Show success toast
      toast({
        title: "Export Successful",
        description: `${projects.length} projects exported as ${format.toUpperCase()} successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the projects. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
      setCurrentFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          disabled={isExporting || !projects || projects.length === 0}
          size={compact ? "sm" : "default"}
          className={compact ? "h-8 px-3" : ""}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              {showIcon && <DownloadIcon className={`${compact ? "h-3 w-3" : "h-4 w-4"} ${compact ? "mr-1" : "mr-2"}`} />}
              {buttonText}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export {projects?.length || 0} Projects As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <span>PDF Document {currentFormat === 'pdf' && <Loader2 className="ml-2 h-3 w-3 inline animate-spin" />}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <span>Excel Spreadsheet {currentFormat === 'excel' && <Loader2 className="ml-2 h-3 w-3 inline animate-spin" />}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileX2 className="mr-2 h-4 w-4 text-gray-600" />
          <span>CSV File {currentFormat === 'csv' && <Loader2 className="ml-2 h-3 w-3 inline animate-spin" />}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectsExportOptions;
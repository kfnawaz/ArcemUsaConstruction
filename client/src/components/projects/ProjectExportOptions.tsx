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
import { exportProject, ExportFormat } from '@/utils/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ProjectExportOptionsProps {
  project: Project;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  showIcon?: boolean;
}

const ProjectExportOptions = ({ 
  project, 
  buttonText = 'Export Report', 
  variant = 'default',
  showIcon = true 
}: ProjectExportOptionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<ExportFormat | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setCurrentFormat(format);
      
      // Perform the export
      exportProject(project, format);
      
      // Show success toast
      toast({
        title: "Export Successful",
        description: `Project exported as ${format.toUpperCase()} successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the project. Please try again.",
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
        <Button variant={variant} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              {showIcon && <DownloadIcon className="mr-2 h-4 w-4" />}
              {buttonText}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
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

export default ProjectExportOptions;
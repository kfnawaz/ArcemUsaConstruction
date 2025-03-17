import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Service } from '@shared/schema';
import { useService } from '@/hooks/useService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AdminNav from './AdminNav';
import { scrollToTop } from '@/lib/utils';
import { PlusIcon, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ServiceForm from './ServiceForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building,
  Home,
  Wrench,
  Clipboard,
  Factory,
  Settings,
  PencilRuler,
  BarChart,
  HardHat,
} from 'lucide-react';

// Map of service icons to components
const serviceIcons: Record<string, any> = {
  building: Building,
  home: Home,
  tool: Wrench,
  clipboard: Clipboard,
  factory: Factory,
  settings: Settings,
  'pencil-ruler': PencilRuler,
  'bar-chart': BarChart,
  'hard-hat': HardHat,
};

export default function ServicesManagement() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { services, isLoadingServices, deleteService } = useService();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | undefined>(undefined);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Setup page on mount
  useEffect(() => {
    scrollToTop();
    document.title = 'Services Management - Admin';
  }, []);

  // Filter services based on search query
  const filteredServices = services?.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle edit button click
  const handleEditClick = (service: Service) => {
    setCurrentEditId(service.id);
    setIsEditing(true);
  };

  // Handle delete button click
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setConfirmationOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete.id);
      toast({
        title: 'Service deleted',
        description: `"${serviceToDelete.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Delete failed',
        description: 'There was a problem deleting the service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setServiceToDelete(null);
      setConfirmationOpen(false);
    }
  };

  // Render icon for a service
  const renderServiceIcon = (iconName: string) => {
    const IconComponent = serviceIcons[iconName] || Building;
    return <IconComponent className="h-5 w-5" />;
  };

  // Truncate description text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Admin Navigation */}
          <AdminNav activePage="services" />
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-montserrat font-bold">Services Management</h1>
                  <p className="text-muted-foreground">
                    Create and manage services offered by your construction company.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setIsCreating(true)} 
                  className="flex items-center gap-2 md:self-start"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add New Service
                </Button>
              </div>
              
              {/* Search and filters */}
              <div className="mb-6">
                <Input
                  placeholder="Search services by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {/* Services list */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="hidden md:table-cell">Features</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingServices ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Loading services...
                        </TableCell>
                      </TableRow>
                    ) : filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchQuery ? 'No services found matching your search.' : 'No services have been created yet.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="align-middle">
                            {renderServiceIcon(service.icon)}
                          </TableCell>
                          <TableCell className="font-medium align-middle">
                            {service.title}
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-middle">
                            {truncateText(service.description, 100)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-middle">
                            <div className="flex flex-wrap gap-1">
                              {service.features && service.features.length > 0 ? (
                                service.features.slice(0, 3).map((feature, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-muted rounded-md"
                                  >
                                    {feature}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">No features</span>
                              )}
                              {service.features && service.features.length > 3 && (
                                <span className="inline-block px-2 py-1 text-xs bg-muted rounded-md">
                                  +{service.features.length - 3} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(service)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(service)}
                                title="Delete"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service creation/editing dialogs */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <ServiceForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <ServiceForm 
            serviceId={currentEditId} 
            onClose={() => {
              setIsEditing(false);
              setCurrentEditId(undefined);
            }} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation */}
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the service "{serviceToDelete?.title}"?
              This action cannot be undone and will remove all associated gallery images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState } from 'react';
import { useService } from '@/hooks/useService';
import { Service } from '@shared/schema';
import ServiceManager from '@/components/admin/ServiceManager';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Plus, Pencil, Trash2, Building, Home, Wrench, Clipboard, Factory, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ServicesManagement = () => {
  const { toast } = useToast();
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const {
    services,
    isLoadingServices,
    deleteService,
    isDeletingService,
  } = useService();

  // Handle clicking edit button
  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsServiceDialogOpen(true);
  };

  // Handle clicking add new service
  const handleAddNewClick = () => {
    setSelectedService(undefined);
    setIsServiceDialogOpen(true);
  };

  // Handle clicking delete button
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  // Confirm and execute service deletion
  const confirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await deleteService(serviceToDelete.id);
        toast({
          title: 'Service deleted',
          description: `${serviceToDelete.title} has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({
          title: 'Deletion failed',
          description: 'There was an error deleting the service.',
          variant: 'destructive',
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setServiceToDelete(null);
      }
    }
  };

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'building':
        return <Building className="w-5 h-5" />;
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'tool':
        return <Wrench className="w-5 h-5" />;
      case 'clipboard':
        return <Clipboard className="w-5 h-5" />;
      case 'factory':
        return <Factory className="w-5 h-5" />;
      case 'settings':
        return <Settings className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services Management</h1>
        <Button onClick={handleAddNewClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Service
        </Button>
      </div>

      {isLoadingServices ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : services && services.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center justify-center text-primary">
                      {getIcon(service.icon)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell>
                    {service.features && service.features.length > 0
                      ? `${service.features.length} feature${service.features.length !== 1 ? 's' : ''}`
                      : 'No features'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {service.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(service)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first service.
          </p>
          <Button onClick={handleAddNewClick}>Add a Service</Button>
        </div>
      )}

      {/* Service Dialog (Add/Edit) */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>
          <ServiceManager
            service={selectedService}
            onSuccess={() => setIsServiceDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serviceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeletingService}
            >
              {isDeletingService ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesManagement;
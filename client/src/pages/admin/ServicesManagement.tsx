import { useState, useEffect } from 'react';
import { useService } from '@/hooks/useService';
import { Service } from '@shared/schema';
import ServiceManager from '@/components/admin/ServiceManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { scrollToTop } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, 
  DialogClose
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Search, Building, Home, Wrench, Clipboard, Factory, Settings, PencilRuler, BarChart, HardHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminNav from '@/components/admin/AdminNav';

const ServicesManagement = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | undefined>(undefined);

  const {
    services,
    isLoadingServices,
    deleteService,
    isDeletingService,
  } = useService();

  // Get URL params from location for initial state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1] || '');
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');
    
    if (action === 'new') {
      setIsAdding(true);
      setIsEditing(false);
      setCurrentEditId(undefined);
      setSelectedService(undefined);
      setIsServiceDialogOpen(true);
    } else if (editId) {
      setIsEditing(true);
      setIsAdding(false);
      const id = Number(editId);
      setCurrentEditId(id);
      // Find the service with this ID
      const service = services?.find(s => s.id === id);
      if (service) {
        setSelectedService(service);
      }
      setIsServiceDialogOpen(true);
    } else {
      setIsEditing(false);
      setIsAdding(false);
      setCurrentEditId(undefined);
      setIsServiceDialogOpen(false);
    }
  }, [location, services]);

  useEffect(() => {
    scrollToTop();
    document.title = 'Service Management - ARCEMUSA';
  }, []);

  // Handle clicking edit button
  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditing(true);
    setIsAdding(false);
    setCurrentEditId(service.id);
    setLocation(`/admin/services?edit=${service.id}`);
  };

  // Handle clicking add new service
  const handleAddNewClick = () => {
    setSelectedService(undefined);
    setIsAdding(true);
    setIsEditing(false);
    setCurrentEditId(undefined);
    setLocation('/admin/services?action=new');
  };

  // Handle clicking delete button
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteDialog(true);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
        setShowDeleteDialog(false);
        setServiceToDelete(null);
      }
    }
  };

  // Close form and return to list
  const handleCloseForm = () => {
    setIsServiceDialogOpen(false);
    setIsEditing(false);
    setIsAdding(false);
    setCurrentEditId(undefined);
    setLocation('/admin/services');
  };

  // Filter services based on search query
  const filteredServices = services?.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      case 'pencil-ruler':
        return <PencilRuler className="w-5 h-5" />;
      case 'bar-chart':
        return <BarChart className="w-5 h-5" />;
      case 'hard-hat':
        return <HardHat className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Admin Navigation */}
          <AdminNav activePage="services" />
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Service List */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-montserrat font-bold">Service Management</h1>
                <Button variant="gold" onClick={handleAddNewClick}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Service
                </Button>
              </div>
              
              {/* Search bar */}
              <div className="mb-6 relative">
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border border-gray-300"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              {/* Services table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-montserrat font-medium text-gray-500 uppercase tracking-wider">
                        Icon
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-montserrat font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-montserrat font-medium text-gray-500 uppercase tracking-wider">
                        Features
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-montserrat font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-montserrat font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingServices ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="animate-pulse flex items-center justify-center">
                            <div className="h-4 w-36 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredServices?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No services found
                        </td>
                      </tr>
                    ) : (
                      filteredServices?.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center text-primary">
                              {getIcon(service.icon)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {service.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {service.features && service.features.length > 0
                                ? `${service.features.length} feature${service.features.length !== 1 ? 's' : ''}`
                                : 'No features'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {service.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(service)}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(service)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Dialog (Add/Edit) */}
      <Dialog 
        open={isServiceDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // When dialog is closed, reset URL and state
            handleCloseForm();
          }
          setIsServiceDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {selectedService ? 'Update the details of this service' : 'Create a new service for your website'}
            </DialogDescription>
          </DialogHeader>
          <ServiceManager
            service={selectedService}
            onSuccess={handleCloseForm}
          />
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Clean up when dialog is closed without confirmation
            setServiceToDelete(null);
          }
          setShowDeleteDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the service "{serviceToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeletingService}
            >
              {isDeletingService ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
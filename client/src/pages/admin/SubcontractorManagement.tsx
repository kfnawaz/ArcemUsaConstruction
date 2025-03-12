import { useState, useEffect } from 'react';
import { useSubcontractors } from '@/hooks/useSubcontractors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MoreHorizontal, Mail, Phone, ExternalLink, Building, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Subcontractor, Vendor } from '@shared/schema';

export default function SubcontractorManagement() {
  const [location, setLocation] = useLocation();
  const { user, loading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('subcontractors');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  const {
    subcontractors,
    vendors,
    isLoadingSubcontractors,
    isLoadingVendors,
    updateSubcontractorStatus,
    updateSubcontractorNotes,
    deleteSubcontractor,
    updateVendorStatus,
    updateVendorNotes,
    deleteVendor,
  } = useSubcontractors();

  // Initial data loading
  useEffect(() => {
    // This will check if user is logged in and has admin role
    if (!isLoadingAuth && (!user || user.role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'You must be an admin to view this page.',
        variant: 'destructive',
      });
      setLocation('/');
    }
  }, [user, isLoadingAuth, toast, setLocation]);

  // Set page title
  useEffect(() => {
    document.title = 'Subcontractor & Vendor Management - ARCEMUSA Admin';
  }, []);

  // Open subcontractor details dialog
  const viewSubcontractorDetails = (subcontractor: Subcontractor) => {
    setSelectedSubcontractor(subcontractor);
    setSelectedVendor(null);
    setNotes(subcontractor.notes || '');
    setStatus(subcontractor.status);
    setIsDetailsOpen(true);
  };

  // Open vendor details dialog
  const viewVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedSubcontractor(null);
    setNotes(vendor.notes || '');
    setStatus(vendor.status);
    setIsDetailsOpen(true);
  };

  // Save subcontractor changes
  const saveSubcontractorChanges = async () => {
    if (!selectedSubcontractor) return;
    
    try {
      if (status !== selectedSubcontractor.status) {
        await updateSubcontractorStatus(selectedSubcontractor.id, status);
      }
      
      if (notes !== selectedSubcontractor.notes) {
        await updateSubcontractorNotes(selectedSubcontractor.id, notes);
      }
      
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error updating subcontractor:', error);
    }
  };

  // Save vendor changes
  const saveVendorChanges = async () => {
    if (!selectedVendor) return;
    
    try {
      if (status !== selectedVendor.status) {
        await updateVendorStatus(selectedVendor.id, status);
      }
      
      if (notes !== selectedVendor.notes) {
        await updateVendorNotes(selectedVendor.id, notes);
      }
      
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  };

  // Handle delete subcontractor
  const handleDeleteSubcontractor = async (id: number) => {
    if (confirm('Are you sure you want to delete this subcontractor application? This action cannot be undone.')) {
      try {
        await deleteSubcontractor(id);
        toast({
          title: 'Application Deleted',
          description: 'The subcontractor application has been deleted.',
        });
      } catch (error) {
        console.error('Error deleting subcontractor:', error);
      }
    }
  };

  // Handle delete vendor
  const handleDeleteVendor = async (id: number) => {
    if (confirm('Are you sure you want to delete this vendor application? This action cannot be undone.')) {
      try {
        await deleteVendor(id);
        toast({
          title: 'Application Deleted',
          description: 'The vendor application has been deleted.',
        });
      } catch (error) {
        console.error('Error deleting vendor:', error);
      }
    }
  };

  // Filter subcontractors based on status
  const filteredSubcontractors = subcontractors.filter(s => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  // Filter vendors based on status
  const filteredVendors = vendors.filter(v => {
    if (statusFilter === 'all') return true;
    return v.status === statusFilter;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-600">Pending</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (isLoadingAuth || (!user && isLoadingAuth)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Subcontractor & Vendor Management</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm">Filter:</Label>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status-filter" className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subcontractors Tab Content */}
      {activeTab === 'subcontractors' && (
        <Card>
          <CardHeader>
            <CardTitle>Subcontractor Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSubcontractors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSubcontractors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subcontractor applications found
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all subcontractor applications</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubcontractors.map((subcontractor) => (
                    <TableRow key={subcontractor.id}>
                      <TableCell className="font-medium">{subcontractor.companyName}</TableCell>
                      <TableCell>{subcontractor.contactName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{subcontractor.serviceDescription}</TableCell>
                      <TableCell>{getStatusBadge(subcontractor.status || 'pending')}</TableCell>
                      <TableCell>{subcontractor.createdAt ? formatDate(subcontractor.createdAt) : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewSubcontractorDetails(subcontractor)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteSubcontractor(subcontractor.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vendors Tab Content */}
      {activeTab === 'vendors' && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingVendors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vendor applications found
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all vendor applications</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.companyName}</TableCell>
                      <TableCell>{vendor.contactName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{vendor.serviceDescription}</TableCell>
                      <TableCell>{getStatusBadge(vendor.status || 'pending')}</TableCell>
                      <TableCell>{vendor.createdAt ? formatDate(vendor.createdAt) : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewVendorDetails(vendor)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSubcontractor 
                ? `Subcontractor: ${selectedSubcontractor.companyName}`
                : selectedVendor 
                  ? `Vendor: ${selectedVendor.companyName}`
                  : 'Application Details'
              }
            </DialogTitle>
            <DialogDescription>
              View and update application details
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubcontractor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSubcontractor.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedSubcontractor.email}`} className="text-blue-600 hover:underline">
                        {selectedSubcontractor.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedSubcontractor.phone}`} className="text-blue-600 hover:underline">
                        {selectedSubcontractor.phone}
                      </a>
                    </div>
                    {selectedSubcontractor.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={selectedSubcontractor.website} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Location</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div>{selectedSubcontractor.address}</div>
                        <div>{selectedSubcontractor.city}, {selectedSubcontractor.state} {selectedSubcontractor.zip}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Services</h3>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedSubcontractor.serviceTypes && selectedSubcontractor.serviceTypes.join(', ')}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedSubcontractor.serviceDescription}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                  <ul className="text-sm">
                    <li><span className="font-medium">Years in Business:</span> {selectedSubcontractor.yearsInBusiness}</li>
                    <li><span className="font-medium">Insurance:</span> {selectedSubcontractor.insurance ? 'Yes' : 'No'}</li>
                    <li><span className="font-medium">Bondable:</span> {selectedSubcontractor.bondable ? 'Yes' : 'No'}</li>
                    {selectedSubcontractor.licenses && (
                      <li><span className="font-medium">Licenses:</span> {selectedSubcontractor.licenses}</li>
                    )}
                    {selectedSubcontractor.references && (
                      <li><span className="font-medium">References:</span> {selectedSubcontractor.references}</li>
                    )}
                    {selectedSubcontractor.howDidYouHear && (
                      <li><span className="font-medium">How they heard about us:</span> {selectedSubcontractor.howDidYouHear}</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Application Status</h3>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Add notes about this application"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          
          {selectedVendor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedVendor.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedVendor.email}`} className="text-blue-600 hover:underline">
                        {selectedVendor.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedVendor.phone}`} className="text-blue-600 hover:underline">
                        {selectedVendor.phone}
                      </a>
                    </div>
                    {selectedVendor.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={selectedVendor.website} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Location</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div>{selectedVendor.address}</div>
                        <div>{selectedVendor.city}, {selectedVendor.state} {selectedVendor.zip}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Products</h3>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedVendor.supplyTypes && selectedVendor.supplyTypes.join(', ')}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedVendor.serviceDescription}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                  <ul className="text-sm">
                    <li><span className="font-medium">Years in Business:</span> {selectedVendor.yearsInBusiness}</li>
                    {selectedVendor.references && (
                      <li><span className="font-medium">References:</span> {selectedVendor.references}</li>
                    )}
                    {selectedVendor.howDidYouHear && (
                      <li><span className="font-medium">How they heard about us:</span> {selectedVendor.howDidYouHear}</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Application Status</h3>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Add notes about this application"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
  
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
            <Button 
              onClick={selectedSubcontractor ? saveSubcontractorChanges : saveVendorChanges}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
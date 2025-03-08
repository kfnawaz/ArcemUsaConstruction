import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Search, ClipboardList, Eye, CheckCircle2 } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { apiRequest } from "@/lib/queryClient";
import { QuoteRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

const QuoteRequestsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteRequest | null>(null);
  const [quoteToView, setQuoteToView] = useState<QuoteRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch quote requests
  const { data: quoteRequests = [], isLoading } = useQuery({
    queryKey: ["/api/admin/quote/requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/quote/requests");
      return res.json();
    }
  });

  // Delete quote request mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/quote/requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote/requests"] });
      toast({
        title: "Quote request deleted",
        description: "The quote request has been removed.",
        variant: "default",
      });
      setQuoteToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the quote request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/quote/requests/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote/requests"] });
      toast({
        title: "Status updated",
        description: "The quote request status has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update the quote request status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mark as reviewed mutation
  const markAsReviewedMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/quote/requests/${id}/reviewed`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote/requests"] });
      toast({
        title: "Marked as reviewed",
        description: "The quote request has been marked as reviewed.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to mark as reviewed. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter quote requests based on search term and status
  const filteredQuoteRequests = quoteRequests.filter((quote: QuoteRequest) => {
    const searchMatches = 
      quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.company && quote.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatches = statusFilter === "all" || quote.status === statusFilter;
    
    return searchMatches && statusMatches;
  });

  // Get counts for tabs
  const pendingCount = quoteRequests.filter(q => q.status === "pending").length;
  const reviewingCount = quoteRequests.filter(q => q.status === "reviewing").length;
  const acceptedCount = quoteRequests.filter(q => q.status === "accepted").length;
  const rejectedCount = quoteRequests.filter(q => q.status === "rejected").length;
  const completedCount = quoteRequests.filter(q => q.status === "completed").length;
  const unreadCount = quoteRequests.filter(q => !q.reviewed).length;

  // Handle delete confirmation
  const confirmDelete = (quote: QuoteRequest) => {
    setQuoteToDelete(quote);
  };

  // Handle delete
  const handleDelete = () => {
    if (quoteToDelete) {
      deleteQuoteMutation.mutate(quoteToDelete.id);
    }
  };

  // Handle view quote details
  const viewQuoteDetails = (quote: QuoteRequest) => {
    setQuoteToView(quote);
    // If not reviewed yet, mark as reviewed
    if (!quote.reviewed) {
      markAsReviewedMutation.mutate(quote.id);
    }
  };

  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      completed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    
    return (
      <Badge className={`${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="admin-quote-requests-management">
      <AdminNav activePage="dashboard" />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <ClipboardList className="mr-2 h-6 w-6" />
            Quote Requests
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} Unread
              </Badge>
            )}
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-10 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          onValueChange={(value) => setStatusFilter(value)}
          className="mb-6"
        >
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="all">All ({quoteRequests.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="reviewing">Reviewing ({reviewingCount})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({acceptedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border bg-white dark:bg-gray-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Contact Info</TableHead>
                      <TableHead>Project Type</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuoteRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No quote requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuoteRequests.map((quote: QuoteRequest) => (
                        <TableRow 
                          key={quote.id}
                          className={!quote.reviewed ? "bg-muted/30" : ""}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold">{quote.name}</span>
                              <span className="text-sm text-muted-foreground">{quote.email}</span>
                              {quote.company && (
                                <span className="text-xs text-muted-foreground">{quote.company}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{quote.projectType}</TableCell>
                          <TableCell>{quote.budget || "—"}</TableCell>
                          <TableCell>
                            {formatDate(quote.createdAt)}
                            {!quote.reviewed && (
                              <Badge variant="secondary" className="ml-2">New</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(quote.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewQuoteDetails(quote)}
                              className="mr-1"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(quote)}
                              disabled={deleteQuoteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* Repeat similar TabsContent for other tabs (pending, reviewing, etc.) if needed */}
          <TabsContent value="pending">{/* Similar table structure with filtered data */}</TabsContent>
          <TabsContent value="reviewing">{/* Similar table structure with filtered data */}</TabsContent>
          <TabsContent value="accepted">{/* Similar table structure with filtered data */}</TabsContent>
          <TabsContent value="rejected">{/* Similar table structure with filtered data */}</TabsContent>
          <TabsContent value="completed">{/* Similar table structure with filtered data */}</TabsContent>
        </Tabs>
      </div>
      
      {/* Quote Details Dialog */}
      <Dialog open={!!quoteToView} onOpenChange={() => setQuoteToView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quote Request Details</DialogTitle>
            <DialogDescription>
              Submitted on {quoteToView ? formatDate(quoteToView.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          
          {quoteToView && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
                  <div className="mt-1">
                    <p className="font-semibold">{quoteToView.name}</p>
                    <p>{quoteToView.email}</p>
                    <p>{quoteToView.phone || "No phone provided"}</p>
                    {quoteToView.company && <p>Company: {quoteToView.company}</p>}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Project Details</h3>
                  <div className="mt-1">
                    <p><span className="font-semibold">Type:</span> {quoteToView.projectType}</p>
                    {quoteToView.projectSize && (
                      <p><span className="font-semibold">Size:</span> {quoteToView.projectSize}</p>
                    )}
                    {quoteToView.budget && (
                      <p><span className="font-semibold">Budget:</span> {quoteToView.budget}</p>
                    )}
                    {quoteToView.timeframe && (
                      <p><span className="font-semibold">Timeframe:</span> {quoteToView.timeframe}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Project Description</h3>
                <div className="mt-1 p-3 bg-muted rounded-md max-h-[200px] overflow-y-auto">
                  <p>{quoteToView.description}</p>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Update Status</h3>
                <div className="flex items-center mt-1 space-x-2">
                  <Select
                    defaultValue={quoteToView.status}
                    onValueChange={(value) => handleStatusChange(quoteToView.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Current: {getStatusBadge(quoteToView.status)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuoteToView(null)}
            >
              Close
            </Button>
            {quoteToView && !quoteToView.reviewed && (
              <Button
                onClick={() => markAsReviewedMutation.mutate(quoteToView.id)}
                disabled={markAsReviewedMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {markAsReviewedMutation.isPending ? "Marking..." : "Mark as Reviewed"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote request? This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded-sm">
                <strong className="block">From:</strong> {quoteToDelete?.name} ({quoteToDelete?.email})
                <strong className="block mt-1">Project Type:</strong> {quoteToDelete?.projectType}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteQuoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuoteRequestsManagement;
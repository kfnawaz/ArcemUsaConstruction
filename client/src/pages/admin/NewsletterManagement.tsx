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
import { Loader2, Trash2, Search, Mail } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { apiRequest } from "@/lib/queryClient";
import { NewsletterSubscriber } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

const NewsletterManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);

  // Fetch subscribers
  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["/api/admin/newsletter/subscribers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/newsletter/subscribers");
      return res.json();
    }
  });

  // Delete subscriber mutation
  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/newsletter/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/subscribers"] });
      toast({
        title: "Subscriber deleted",
        description: "The subscriber has been removed from the list.",
        variant: "default",
      });
      setSubscriberToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the subscriber. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter((subscriber: NewsletterSubscriber) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      subscriber.email.toLowerCase().includes(searchLower) ||
      (subscriber.firstName && subscriber.firstName.toLowerCase().includes(searchLower)) ||
      (subscriber.lastName && subscriber.lastName.toLowerCase().includes(searchLower))
    );
  });

  // Handle delete confirmation
  const confirmDelete = (subscriber: NewsletterSubscriber) => {
    setSubscriberToDelete(subscriber);
  };

  // Handle delete
  const handleDelete = () => {
    if (subscriberToDelete) {
      deleteSubscriberMutation.mutate(subscriberToDelete.id);
    }
  };

  return (
    <div className="admin-newsletter-management">
      <AdminNav activePage="dashboard" />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Mail className="mr-2 h-6 w-6" />
            Newsletter Subscribers
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              className="pl-10 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border bg-white dark:bg-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No subscribers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((subscriber: NewsletterSubscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>
                          {subscriber.firstName || subscriber.lastName ? 
                            `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim() : 
                            '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subscriber.subscribed 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {subscriber.subscribed ? 'Active' : 'Unsubscribed'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(subscriber.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(subscriber)}
                            disabled={deleteSubscriberMutation.isPending}
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
            
            <div className="mt-4 text-sm text-muted-foreground">
              Total Subscribers: {filteredSubscribers.length}
            </div>
          </>
        )}
      </div>
      
      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={!!subscriberToDelete} onOpenChange={() => setSubscriberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscriber? This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded-sm">
                <strong className="block">Email:</strong> {subscriberToDelete?.email}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteSubscriberMutation.isPending ? (
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

export default NewsletterManagement;
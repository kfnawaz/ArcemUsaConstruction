import React, { useState } from "react";
import { useTestimonials } from "@/hooks/useTestimonials";
import AdminNav from "@/components/admin/AdminNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, Trash2, Star } from "lucide-react";
import { Testimonial } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";

const TestimonialsManagement = () => {
  const {
    allTestimonials,
    pendingTestimonials,
    isLoadingAllTestimonials,
    isLoadingPendingTestimonials,
    approveTestimonial,
    deleteTestimonial,
    isApproving,
    isDeleting,
  } = useTestimonials();

  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  const handleDeleteConfirm = () => {
    if (testimonialToDelete) {
      deleteTestimonial(testimonialToDelete.id);
      setTestimonialToDelete(null);
    }
  };

  const renderTestimonialCard = (testimonial: Testimonial) => (
    <Card key={testimonial.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={testimonial.image} alt={testimonial.name} />
              <AvatarFallback>
                {testimonial.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{testimonial.name}</CardTitle>
              <CardDescription>
                {testimonial.position}, {testimonial.company}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <div className="flex mt-2 space-x-2">
          {testimonial.approved ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Pending
            </Badge>
          )}
          {testimonial.email && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {testimonial.email}
            </Badge>
          )}
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {formatDate(testimonial.createdAt)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm italic">"{testimonial.content}"</p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pt-0">
        {!testimonial.approved && (
          <Button
            size="sm"
            onClick={() => approveTestimonial(testimonial.id)}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setTestimonialToDelete(testimonial)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the testimonial from {testimonial.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav activePage="testimonials" />
      
      <div className="mt-8">
        <h1 className="text-3xl font-bold mb-6">Testimonials Management</h1>
        
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending Approval
              {pendingTestimonials?.length > 0 && (
                <Badge className="ml-2 bg-primary" variant="secondary">
                  {pendingTestimonials.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Testimonials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {isLoadingPendingTestimonials ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingTestimonials?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Pending Testimonials</h3>
                  <p className="text-muted-foreground">
                    All testimonials have been reviewed. Check back later for new submissions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingTestimonials?.map(renderTestimonialCard)
            )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            {isLoadingAllTestimonials ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allTestimonials?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Testimonials Yet</h3>
                  <p className="text-muted-foreground">
                    No testimonials have been submitted yet. Encourage your clients to share their experience.
                  </p>
                </CardContent>
              </Card>
            ) : (
              allTestimonials?.map(renderTestimonialCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestimonialsManagement;
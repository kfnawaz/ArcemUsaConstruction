import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertJobPostingSchema, type JobPosting } from "@shared/schema";
import { useCareers } from "@/hooks/useCareers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Clock, Upload, Check, X, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToExcel, formatDataForExport } from "@/utils/excelExport";

// Extend the insert schema with additional validation
const jobPostingFormSchema = insertJobPostingSchema.extend({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  department: z.string().min(2, { message: "Department is required" }),
  location: z.string().min(2, { message: "Location is required" }),
  description: z.string().min(30, { message: "Description must be at least 30 characters" }),
  requirements: z.string().min(30, { message: "Requirements must be at least 30 characters" }),
  responsibilities: z.string().min(30, { message: "Responsibilities must be at least 30 characters" }),
});

type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;

export default function CareersManagement() {
  const { 
    allJobPostings, 
    isLoadingAll,
    createJobPosting,
    updateJobPosting,
    toggleActiveStatus,
    toggleFeaturedStatus,
    deleteJobPosting,
    isCreating,
    isUpdating,
    isTogglingActive,
    isTogglingFeatured,
    isDeleting
  } = useCareers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentJobPosting, setCurrentJobPosting] = useState<JobPosting | null>(null);
  const [activeTab, setActiveTab] = useState("all"); // all, active, inactive

  // Form for creating new job postings
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingFormSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      type: "full-time",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      salary: "",
      applyUrl: "",
      active: true,
      featured: false,
    },
  });

  // Form for editing job postings
  const editForm = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingFormSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      type: "full-time",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      salary: "",
      applyUrl: "",
      active: true,
      featured: false,
    },
  });

  const onCreateSubmit = (values: JobPostingFormValues) => {
    createJobPosting(values);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  const onEditSubmit = (values: JobPostingFormValues) => {
    if (currentJobPosting) {
      updateJobPosting(currentJobPosting.id, values);
      setIsEditDialogOpen(false);
      editForm.reset();
    }
  };

  const handleEditClick = (jobPosting: JobPosting) => {
    setCurrentJobPosting(jobPosting);
    editForm.reset({
      title: jobPosting.title,
      department: jobPosting.department,
      location: jobPosting.location,
      type: jobPosting.type,
      description: jobPosting.description,
      requirements: jobPosting.requirements,
      responsibilities: jobPosting.responsibilities,
      benefits: jobPosting.benefits || "",
      salary: jobPosting.salary || "",
      applyUrl: jobPosting.applyUrl || "",
      active: jobPosting.active,
      featured: jobPosting.featured,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (jobPosting: JobPosting) => {
    setCurrentJobPosting(jobPosting);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currentJobPosting) {
      deleteJobPosting(currentJobPosting.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = (jobPosting: JobPosting) => {
    toggleActiveStatus(jobPosting.id);
  };

  const handleToggleFeatured = (jobPosting: JobPosting) => {
    toggleFeaturedStatus(jobPosting.id);
  };

  const handleExportToExcel = () => {
    if (!allJobPostings || allJobPostings.length === 0) return;
    
    const formattedData = formatDataForExport(
      allJobPostings, 
      ['id', 'updatedAt'], 
      ['createdAt']
    );
    
    exportToExcel(formattedData, 'job_postings', 'Job Postings');
  };

  // Filter job postings based on the active tab
  const filteredJobPostings = allJobPostings ? allJobPostings.filter((job: JobPosting) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return job.active === true;
    if (activeTab === "inactive") return job.active === false;
    if (activeTab === "featured") return job.featured === true;
    return true;
  }) : [];

  // Count job postings by status
  const activeCount = allJobPostings ? allJobPostings.filter((job: JobPosting) => job.active === true).length : 0;
  const inactiveCount = allJobPostings ? allJobPostings.filter((job: JobPosting) => job.active === false).length : 0;
  const featuredCount = allJobPostings ? allJobPostings.filter((job: JobPosting) => job.featured === true).length : 0;
  const totalCount = allJobPostings ? allJobPostings.length : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Careers Management</h1>
          <p className="text-muted-foreground">Manage job postings and career opportunities</p>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={handleExportToExcel}
            disabled={!allJobPostings || allJobPostings.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Job Posting
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Posting</DialogTitle>
                <DialogDescription>
                  Add a new job posting. The posting will be visible on the careers page if active.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Project Manager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Construction Management" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. New York, NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-time">Full Time</SelectItem>
                              <SelectItem value="part-time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="temporary">Temporary</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed description of the job..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsibilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsibilities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List the key responsibilities for this position..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Use bullet points (each on a new line) for better readability
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List the requirements for this position..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Use bullet points (each on a new line) for better readability
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List the benefits offered with this position..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Use bullet points (each on a new line) for better readability
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Range (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. $60,000 - $80,000" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="applyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            External link for applications, if any
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active</FormLabel>
                            <FormDescription>
                              Make this job posting visible on the website
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured</FormLabel>
                            <FormDescription>
                              Highlight this job posting on the website
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Job Posting"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Postings Overview</CardTitle>
          <CardDescription>
            Manage all job listings from this dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active">
                Active
                <Badge variant="secondary" className="ml-2">{activeCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive
                <Badge variant="secondary" className="ml-2">{inactiveCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="featured">
                Featured
                <Badge variant="secondary" className="ml-2">{featuredCount}</Badge>
              </TabsTrigger>
            </TabsList>
            <div className="mt-4">
              {isLoadingAll ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[450px]">
                  {filteredJobPostings.length === 0 ? (
                    <Alert>
                      <AlertTitle>No job postings found</AlertTitle>
                      <AlertDescription>
                        {activeTab === "all" 
                          ? "You haven't created any job postings yet." 
                          : `No ${activeTab} job postings found.`}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="hidden md:table-cell">Location</TableHead>
                          <TableHead className="hidden md:table-cell">Type</TableHead>
                          <TableHead className="hidden md:table-cell">Date Posted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobPostings.map((job: JobPosting) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">
                              {job.title}
                              {job.featured && (
                                <Badge variant="outline" className="ml-2">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 stroke-yellow-400" />
                                  Featured
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{job.department}</TableCell>
                            <TableCell className="hidden md:table-cell">{job.location}</TableCell>
                            <TableCell className="hidden md:table-cell capitalize">{job.type}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(job.createdAt)}</TableCell>
                            <TableCell>
                              {job.active ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleToggleActive(job)}
                                  disabled={isTogglingActive}
                                  title={job.active ? "Deactivate" : "Activate"}
                                >
                                  {job.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleToggleFeatured(job)}
                                  disabled={isTogglingFeatured}
                                  title={job.featured ? "Remove from featured" : "Mark as featured"}
                                >
                                  <Star className={`h-4 w-4 ${job.featured ? "fill-yellow-400 stroke-yellow-400" : ""}`} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditClick(job)}
                                  title="Edit"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteClick(job)}
                                  disabled={isDeleting}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
            <DialogDescription>
              Update this job posting details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Project Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Construction Management" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. New York, NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full Time</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of the job..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the key responsibilities for this position..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Use bullet points (each on a new line) for better readability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the requirements for this position..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Use bullet points (each on a new line) for better readability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the benefits offered with this position..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Use bullet points (each on a new line) for better readability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. $60,000 - $80,000" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="applyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        External link for applications, if any
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Make this job posting visible on the website
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured</FormLabel>
                        <FormDescription>
                          Highlight this job posting on the website
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Job Posting"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 mb-4">
            <p className="font-medium">{currentJobPosting?.title}</p>
            <p className="text-sm text-muted-foreground">{currentJobPosting?.department} • {currentJobPosting?.location}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Job Posting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
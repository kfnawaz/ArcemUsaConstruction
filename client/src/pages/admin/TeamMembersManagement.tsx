import { useState } from "react";
import { Helmet } from "react-helmet";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { useAllTeamMembers, useTeamMember } from "@/hooks/useTeamMembers";
import { TeamMember, InsertTeamMember } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const teamMemberFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().min(2, "Designation is required"),
  qualification: z.string().min(2, "Qualification is required"),
  gender: z.string().min(2, "Gender is required"),
  bio: z.string().optional(),
  photo: z.string().optional(),
  order: z.number().optional(),
  active: z.boolean().default(true),
});

type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

export default function TeamMembersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const { data: teamMembers, isLoading } = useAllTeamMembers();
  
  const [isCreatingTeamMember, setIsCreatingTeamMember] = useState(false);
  const [isUpdatingTeamMember, setIsUpdatingTeamMember] = useState(false);
  const [isTogglingActiveStatus, setIsTogglingActiveStatus] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isDeletingTeamMember, setIsDeletingTeamMember] = useState(false);
  
  const createTeamMember = async (data: InsertTeamMember) => {
    setIsCreatingTeamMember(true);
    try {
      await apiRequest('POST', '/api/admin/team-members', data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Success",
        description: "Team member created successfully.",
      });
    } catch (error) {
      console.error("Error creating team member:", error);
      toast({
        title: "Error",
        description: "Failed to create team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTeamMember(false);
    }
  };
  
  const updateTeamMember = async (id: number, data: Partial<InsertTeamMember>) => {
    setIsUpdatingTeamMember(true);
    try {
      await apiRequest('PUT', `/api/admin/team-members/${id}`, data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Success",
        description: "Team member updated successfully.",
      });
    } catch (error) {
      console.error("Error updating team member:", error);
      toast({
        title: "Error",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTeamMember(false);
    }
  };
  
  const toggleActiveStatus = async (id: number) => {
    setIsTogglingActiveStatus(true);
    try {
      await apiRequest('PUT', `/api/admin/team-members/${id}/toggle-active`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Success",
        description: "Team member status updated.",
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingActiveStatus(false);
    }
  };
  
  const updateOrder = async (id: number, order: number) => {
    setIsUpdatingOrder(true);
    try {
      await apiRequest('PUT', `/api/admin/team-members/${id}/order`, { order });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Success",
        description: "Display order updated.",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update display order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  };
  
  const deleteTeamMember = async (id: number) => {
    setIsDeletingTeamMember(true);
    try {
      await apiRequest('DELETE', `/api/admin/team-members/${id}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Success",
        description: "Team member deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: "Failed to delete team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTeamMember(false);
    }
  };
  
  const uploadFile = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return undefined;
    }
  };

  const createForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      designation: "",
      qualification: "",
      gender: "male",
      bio: "",
      order: 0,
      active: true,
    },
  });

  const editForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      designation: "",
      qualification: "",
      gender: "male",
      bio: "",
      order: 0,
      active: true,
    },
  });

  const teamMemberArray = Array.isArray(teamMembers) ? teamMembers : [];
  
  const filteredTeamMembers = teamMemberArray.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = teamMemberArray.filter((member) => member.active === true).length;
  const inactiveCount = teamMemberArray.filter((member) => member.active === false).length;

  const onCreateSubmit = async (values: TeamMemberFormValues) => {
    try {
      let photoUrl = values.photo;
      
      if (selectedFile) {
        setIsUploading(true);
        photoUrl = await uploadFile(selectedFile);
        setIsUploading(false);
      }
      
      await createTeamMember({
        ...values,
        photo: photoUrl || null,
      });
      
      setIsCreateDialogOpen(false);
      createForm.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating team member:", error);
    }
  };

  const onEditSubmit = async (values: TeamMemberFormValues) => {
    if (!selectedMember) return;
    
    try {
      let photoUrl = values.photo;
      
      if (selectedFile) {
        setIsUploading(true);
        photoUrl = await uploadFile(selectedFile);
        setIsUploading(false);
      }
      
      await updateTeamMember(selectedMember.id, {
        ...values,
        photo: photoUrl,
      });
      
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedMember(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating team member:", error);
    }
  };

  const handleEditClick = (member: TeamMember) => {
    setSelectedMember(member);
    editForm.reset({
      name: member.name,
      designation: member.designation,
      qualification: member.qualification,
      gender: member.gender,
      bio: member.bio || "",
      photo: member.photo || "",
      order: member.order || 0,
      active: member.active || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMember) {
      deleteTeamMember(selectedMember.id);
      setSelectedMember(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = (member: TeamMember) => {
    toggleActiveStatus(member.id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <>
      <Helmet>
        <title>Team Members Management | Admin Dashboard</title>
      </Helmet>

      <section className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
            <p className="text-muted-foreground">
              Manage your company's team members and their profiles.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus size={16} /> Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new team member to your company.
                </DialogDescription>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-3">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input placeholder="CEO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification</FormLabel>
                          <FormControl>
                            <Input placeholder="MBA, Harvard" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Lower numbers appear first
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief bio about the team member"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Profile Photo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a profile photo for the team member
                    </FormDescription>
                  </FormItem>

                  <FormField
                    control={createForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>
                            Make this team member visible on the website
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

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="mr-2"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingTeamMember || isUploading}
                    >
                      {(isCreatingTeamMember || isUploading) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isUploading ? "Uploading..." : isCreatingTeamMember ? "Saving..." : "Create Member"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  teamMemberArray.length
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  activeCount
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  inactiveCount
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-background rounded-md border mb-6">
          <div className="p-4 flex items-center">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTeamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <p className="text-muted-foreground">No team members found</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamMembers.map((member: TeamMember) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <img
                        src={member.photo && !member.photo.includes("placeholder-person.jpg") 
                          ? member.photo 
                          : (member.gender === "female" 
                            ? "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='450' height='450' viewBox='0 0 24 24' fill='%231E90DB' stroke='white' stroke-width='0.3' stroke-linecap='round' stroke-linejoin='round'%3e%3crect width='24' height='24' fill='%23e6f3ff' rx='12' ry='12'/%3e%3ccircle cx='12' cy='8' r='4.5' fill='%231E90DB'/%3e%3cpath d='M7 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2' fill='%231E90DB'/%3e%3c/svg%3e" 
                            : "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='450' height='450' viewBox='0 0 24 24' fill='%231E90DB' stroke='white' stroke-width='0.3' stroke-linecap='round' stroke-linejoin='round'%3e%3crect width='24' height='24' fill='%23e6f3ff' rx='12' ry='12'/%3e%3ccircle cx='12' cy='8' r='4.5' fill='%231E90DB'/%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' fill='%231E90DB'/%3e%3c/svg%3e")}
                        alt={member.name}
                        className={`w-8 h-8 rounded-full ${
                          !member.photo || member.photo.includes("placeholder-person.jpg") 
                            ? "bg-gray-50 object-contain p-0.5" 
                            : "object-cover"
                        }`}
                      />
                      {member.name}
                    </TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>{member.qualification}</TableCell>
                    <TableCell>{member.order}</TableCell>
                    <TableCell>
                      {member.active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(member)}
                        disabled={isTogglingActiveStatus}
                      >
                        {isTogglingActiveStatus && selectedMember?.id === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : member.active ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(member)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the details of the selected team member.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input placeholder="MBA, Harvard" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief bio about the team member"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  {selectedMember && (
                    <div className="mb-2 flex items-center space-x-4">
                      <img
                        src={selectedMember.photo && !selectedMember.photo.includes("placeholder-person.jpg") 
                          ? selectedMember.photo 
                          : (selectedMember.gender === "female" 
                            ? "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='450' height='450' viewBox='0 0 24 24' fill='%231E90DB' stroke='white' stroke-width='0.3' stroke-linecap='round' stroke-linejoin='round'%3e%3crect width='24' height='24' fill='%23e6f3ff' rx='12' ry='12'/%3e%3ccircle cx='12' cy='8' r='4.5' fill='%231E90DB'/%3e%3cpath d='M7 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2' fill='%231E90DB'/%3e%3c/svg%3e" 
                            : "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='450' height='450' viewBox='0 0 24 24' fill='%231E90DB' stroke='white' stroke-width='0.3' stroke-linecap='round' stroke-linejoin='round'%3e%3crect width='24' height='24' fill='%23e6f3ff' rx='12' ry='12'/%3e%3ccircle cx='12' cy='8' r='4.5' fill='%231E90DB'/%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' fill='%231E90DB'/%3e%3c/svg%3e")}
                        alt={selectedMember.name}
                        className={`w-16 h-16 rounded-full ${
                          !selectedMember.photo || selectedMember.photo.includes("placeholder-person.jpg") 
                            ? "bg-gray-50 object-contain p-1" 
                            : "object-cover"
                        }`}
                      />
                      <p className="text-sm text-muted-foreground">
                        Current photo
                      </p>
                    </div>
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a new profile photo or keep the existing one
                  </FormDescription>
                </FormItem>

                <FormField
                  control={editForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Make this team member visible on the website
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

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingTeamMember || isUploading}
                  >
                    {(isUpdatingTeamMember || isUploading) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isUploading ? "Uploading..." : isUpdatingTeamMember ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedMember?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-700"
              >
                {isDeletingTeamMember && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </>
  );
}
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlog } from '@/hooks/useBlog';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { 
  ExtendedInsertBlogPost, 
  extendedInsertBlogPostSchema 
} from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

import BlogFeaturedImageUpload from './BlogFeaturedImageUpload';
import CategoryCreator from './CategoryCreator';
import TagCreator from './TagCreator';

interface BlogFormProps {
  postId?: number;
  onClose: () => void;
}

const BlogForm = ({ postId, onClose }: BlogFormProps) => {

  const { post, isLoading, saveBlogPost, isSubmitting, getPostCategoryIds, getPostTagIds } = useBlog(postId);
  const { 
    categories, 
    categoriesLoading, 
    tags, 
    tagsLoading
  } = useBlogCategories();
  
  const form = useForm<ExtendedInsertBlogPost>({
    resolver: zodResolver(extendedInsertBlogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      image: '',
      author: '',
      published: true,
      categoryIds: [],
      tagIds: []
    },
  });

  // Load categories and tags for the post when editing
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      if (post && postId) {
        try {
          const categoryIds = await getPostCategoryIds(postId);
          const tagIds = await getPostTagIds(postId);
          
          form.reset({
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            image: post.image,
            author: post.author,
            published: post.published,
            categoryIds,
            tagIds
          });
        } catch (error) {
          console.error("Error loading post relationships:", error);
        }
      }
    };
    
    if (post) {
      loadCategoriesAndTags();
    }
  }, [form, post, postId, getPostCategoryIds, getPostTagIds]);

  // Generate slug from title when title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);
    
    if (!form.getValues('slug') || form.getValues('slug') === generateSlug(form.getValues('title'))) {
      form.setValue('slug', generateSlug(title));
    }
  };

  const onSubmit = async (data: ExtendedInsertBlogPost) => {
    try {
      // If creating a new post and we have an image, prepare to add it to gallery after post creation
      const imageUrl = data.image || '';
      const shouldAddToGallery = !postId && imageUrl;
      
      // Save the blog post first
      const savedPost = await saveBlogPost(data);
      
      // If this is a new post and we have an image, add it to the gallery
      if (shouldAddToGallery && savedPost && typeof savedPost === 'object' && 'id' in savedPost) {
        const newPostId = savedPost.id;
        console.log(`Adding featured image to gallery for new post ID ${newPostId}`);
        
        try {
          // Add the featured image to the gallery with order=0 to mark it as the main image
          const response = await fetch(`/api/blog/${newPostId}/gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl,
              caption: "Featured image",
              order: 0
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add image to gallery: ${response.statusText}`);
          }
          
          console.log("Successfully added featured image to gallery for new post:", newPostId);
        } catch (error) {
          console.error("Error adding image to gallery for new post:", error);
        }
      }
      
      if (!isSubmitting) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving blog post:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onClose} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-montserrat font-bold">
            {postId ? 'Edit Blog Post' : 'Add New Blog Post'}
          </h1>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-pulse space-y-4 w-full max-w-xl">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-montserrat font-bold">
          {postId ? 'Edit Blog Post' : 'Add New Blog Post'}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter post title" 
                        {...field} 
                        onChange={handleTitleChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter post slug" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL-friendly version of the title (auto-generated if left empty)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Author name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image</FormLabel>
                    <FormControl>
                      <BlogFeaturedImageUpload
                        currentImageUrl={field.value}
                        onImageUpload={(imageUrl) => {
                          // Update form field with new image URL
                          field.onChange(imageUrl);
                          
                          // If we have a post ID and a valid image URL, update the gallery
                          if (postId && imageUrl) {
                            // Using direct API call for consistency since useBlog can't be called within render
                            fetch(`/api/blog/${postId}/gallery`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                imageUrl,
                                caption: "Featured image",
                                order: 0
                              })
                            })
                              .then(response => {
                                if (!response.ok) {
                                  throw new Error(`Failed to add image to gallery: ${response.statusText}`);
                                }
                                console.log("Updated featured image in gallery for post:", postId);
                              })
                              .catch(error => {
                                console.error("Error updating image in gallery:", error);
                              });
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This image will be displayed on blog listings and at the top of the post
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <div className="space-y-3">
                      {categoriesLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading categories...</span>
                        </div>
                      ) : !categories || categories.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No categories available</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={field.value?.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  const newValues = checked
                                    ? [...currentValues, category.id]
                                    : currentValues.filter((id) => id !== category.id);
                                  field.onChange(newValues);
                                }}
                              />
                              <label
                                htmlFor={`category-${category.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {category.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      <CategoryCreator 
                        onCategoryCreated={(categoryId, categoryName) => {
                          // Add the newly created category to the selected categories
                          const currentValues = field.value || [];
                          field.onChange([...currentValues, categoryId]);
                        }}
                      />
                      <FormDescription>
                        Select one or more categories for this blog post
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="space-y-3">
                      {tagsLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading tags...</span>
                        </div>
                      ) : !tags || tags.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No tags available</div>
                      ) : (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                          {tags.map((tag) => {
                            const isSelected = field.value?.includes(tag.id);
                            return (
                              <Badge
                                key={tag.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
                                onClick={() => {
                                  const currentValues = field.value || [];
                                  const newValues = isSelected
                                    ? currentValues.filter((id) => id !== tag.id)
                                    : [...currentValues, tag.id];
                                  field.onChange(newValues);
                                }}
                              >
                                {tag.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <TagCreator 
                        onTagCreated={(tagId, tagName) => {
                          // Add the newly created tag to the selected tags
                          const currentValues = field.value || [];
                          field.onChange([...currentValues, tagId]);
                        }}
                      />
                      <FormDescription>
                        Click tags to add or remove them from this blog post
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief summary of the post" 
                        rows={2}
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed in blog listings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the full content of your blog post" 
                        rows={10}
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Published
                      </FormLabel>
                      <FormDescription>
                        Published posts are visible to site visitors. Unpublished posts are drafts.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    postId ? 'Updating...' : 'Creating...'
                  ) : (
                    postId ? 'Update Post' : 'Create Post'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default BlogForm;

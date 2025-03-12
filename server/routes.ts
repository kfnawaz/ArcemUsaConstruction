import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertProjectGallerySchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
  insertBlogPostSchema,
  insertBlogGallerySchema,
  extendedInsertBlogPostSchema,
  insertMessageSchema,
  insertTestimonialSchema,
  publicTestimonialSchema,
  insertNewsletterSubscriberSchema,
  insertQuoteRequestSchema,
  insertServiceSchema,
  insertServiceGallerySchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { upload, getFileUrl } from "./utils/fileUpload";
import path from "path";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Admin role middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Admin access required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  // API routes prefix
  const apiRouter = "/api";
  
  // Projects Routes
  app.get(`${apiRouter}/projects`, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  app.get(`${apiRouter}/projects/featured`, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getFeaturedProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });
  
  app.get(`${apiRouter}/projects/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  
  // Admin-only endpoints for project management
  app.post(`${apiRouter}/projects`, isAdmin, async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  app.put(`${apiRouter}/projects/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  
  app.delete(`${apiRouter}/projects/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  
  // Project Gallery Routes
  app.get(`${apiRouter}/projects/:projectId/gallery`, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      console.log("[DEBUG] Fetching gallery for project ID:", projectId);
      
      try {
        const images = await storage.getProjectGallery(projectId);
        console.log("[DEBUG] Gallery images:", images);
        res.json(images);
      } catch (error) {
        console.error("[ERROR] Error in getProjectGallery:", error);
        throw error;
      }
    } catch (error) {
      console.error("[ERROR] Gallery fetch error:", error);
      res.status(500).json({ message: "Failed to fetch project gallery" });
    }
  });
  
  app.post(`${apiRouter}/projects/:projectId/gallery`, isAdmin, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const galleryData = insertProjectGallerySchema.parse({
        ...req.body,
        projectId
      });
      
      const image = await storage.addProjectGalleryImage(galleryData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });
  
  app.put(`${apiRouter}/projects/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const imageUpdate = req.body;
      const updatedImage = await storage.updateProjectGalleryImage(id, imageUpdate);
      
      if (!updatedImage) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });
  
  app.delete(`${apiRouter}/projects/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const result = await storage.deleteProjectGalleryImage(id);
      if (!result) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });
  
  // Blog Posts Routes
  app.get(`${apiRouter}/blog`, async (req: Request, res: Response) => {
    try {
      const blogPosts = await storage.getPublishedBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  
  app.get(`${apiRouter}/blog/all`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  
  // Blog Categories Routes
  app.get(`${apiRouter}/blog/categories`, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });
  
  app.post(`${apiRouter}/blog/categories`, isAdmin, async (req: Request, res: Response) => {
    try {
      const categoryData = insertBlogCategorySchema.parse(req.body);
      const category = await storage.createBlogCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Blog Tags Routes
  app.get(`${apiRouter}/blog/tags`, async (req: Request, res: Response) => {
    try {
      const tags = await storage.getBlogTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog tags" });
    }
  });
  
  app.post(`${apiRouter}/blog/tags`, isAdmin, async (req: Request, res: Response) => {
    try {
      const tagData = insertBlogTagSchema.parse(req.body);
      const tag = await storage.createBlogTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tag" });
    }
  });
  
  // Get categories for a specific blog post - must come before the generic /:id route
  app.get(`${apiRouter}/blog/:postId/categories`, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      const categories = await storage.getBlogPostCategories(postId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog post categories:", error);
      res.status(500).json({ message: "Failed to fetch blog post categories" });
    }
  });
  
  // Get tags for a specific blog post - must come before the generic /:id route
  app.get(`${apiRouter}/blog/:postId/tags`, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      const tags = await storage.getBlogPostTags(postId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching blog post tags:", error);
      res.status(500).json({ message: "Failed to fetch blog post tags" });
    }
  });
  
  // Blog Gallery Routes
  app.get(`${apiRouter}/blog/:postId/gallery`, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      console.log(`[DEBUG] Fetching gallery for blog post ID: ${postId}`);
      
      const galleryImages = await storage.getBlogGallery(postId);
      
      console.log(`[DEBUG] Blog gallery images found: ${galleryImages.length}`);
      
      res.json(galleryImages);
    } catch (error) {
      console.error(`[ERROR] Failed to fetch blog gallery:`, error);
      res.status(500).json({ 
        message: "Failed to fetch blog gallery", 
        error: String(error) 
      });
    }
  });

  app.post(`${apiRouter}/blog/:postId/gallery`, isAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      // Check if blog post exists
      const post = await storage.getBlogPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const galleryData = insertBlogGallerySchema.parse({
        ...req.body,
        postId
      });
      
      const galleryImage = await storage.addBlogGalleryImage(galleryData);
      res.status(201).json(galleryImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });

  app.put(`${apiRouter}/blog/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const galleryData = insertBlogGallerySchema.partial().parse(req.body);
      const updatedImage = await storage.updateBlogGalleryImage(id, galleryData);
      
      if (!updatedImage) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });

  app.delete(`${apiRouter}/blog/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const deleted = await storage.deleteBlogGalleryImage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });
  
  app.get(`${apiRouter}/blog/slug/:slug`, async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Get post categories, tags, and gallery images
      const categories = await storage.getBlogPostCategories(post.id);
      const tags = await storage.getBlogPostTags(post.id);
      const galleryImages = await storage.getBlogGallery(post.id);
      
      // Merge post with its categories, tags, and gallery images
      const postWithRelations = {
        ...post,
        categories,
        tags,
        galleryImages
      };
      
      res.json(postWithRelations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  
  // Generic blog post by ID route - keep this after all other /blog/:something routes
  app.get(`${apiRouter}/blog/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Get post categories, tags, and gallery images
      const categories = await storage.getBlogPostCategories(id);
      const tags = await storage.getBlogPostTags(id);
      const galleryImages = await storage.getBlogGallery(id);
      
      // Merge post with its categories, tags, and gallery images
      const postWithRelations = {
        ...post,
        categories,
        tags,
        galleryImages
      };
      
      res.json(postWithRelations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  
  // Admin-only endpoints for blog management
  app.post(`${apiRouter}/blog`, isAdmin, async (req: Request, res: Response) => {
    try {
      // Use the extended schema that includes categoryIds, tagIds, and galleryImages
      const postData = extendedInsertBlogPostSchema.parse(req.body);
      
      // Extract category and tag IDs, and gallery images
      const { categoryIds, tagIds, galleryImages, ...blogPostData } = postData;
      
      // Create the blog post
      const post = await storage.createBlogPost(blogPostData);
      
      // Link categories if provided
      if (categoryIds && categoryIds.length > 0) {
        await storage.linkBlogPostCategories(post.id, categoryIds);
      }
      
      // Link tags if provided
      if (tagIds && tagIds.length > 0) {
        await storage.linkBlogPostTags(post.id, tagIds);
      }
      
      // Add gallery images if provided
      if (galleryImages && galleryImages.length > 0) {
        for (let i = 0; i < galleryImages.length; i++) {
          const galleryImage = {
            postId: post.id,
            imageUrl: galleryImages[i].imageUrl,
            caption: galleryImages[i].caption || null,
            order: galleryImages[i].order || i // Use provided order or index as default
          };
          await storage.addBlogGalleryImage(galleryImage);
        }
      }
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });
  
  app.put(`${apiRouter}/blog/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      // Use the extended schema for update
      const postData = extendedInsertBlogPostSchema.partial().parse(req.body);
      
      // Extract category and tag IDs, and gallery images
      const { categoryIds, tagIds, galleryImages, ...blogPostData } = postData;
      
      // Update the blog post
      const post = await storage.updateBlogPost(id, blogPostData);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Update categories if provided
      if (categoryIds) {
        await storage.updateBlogPostCategories(id, categoryIds);
      }
      
      // Update tags if provided
      if (tagIds) {
        await storage.updateBlogPostTags(id, tagIds);
      }
      
      // Update gallery images if provided
      if (galleryImages) {
        // First remove all existing gallery images
        await storage.deleteAllBlogGalleryImages(id);
        
        // Then add the new gallery images
        if (galleryImages.length > 0) {
          for (let i = 0; i < galleryImages.length; i++) {
            const galleryImage = {
              postId: id,
              imageUrl: galleryImages[i].imageUrl,
              caption: galleryImages[i].caption || null,
              order: galleryImages[i].order || i // Use provided order or index as default
            };
            await storage.addBlogGalleryImage(galleryImage);
          }
        }
      }
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      }
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });
  
  app.delete(`${apiRouter}/blog/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid blog post ID" });
      }
      
      const success = await storage.deleteBlogPost(id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });
  
  // Services Routes
  app.get(`${apiRouter}/services`, async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  
  app.get(`${apiRouter}/services/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });
  
  app.post(`${apiRouter}/services`, isAdmin, async (req: Request, res: Response) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      
      // Handle gallery images if provided
      if (req.body.galleryImages && Array.isArray(req.body.galleryImages)) {
        for (const image of req.body.galleryImages) {
          await storage.addServiceGalleryImage({
            serviceId: service.id,
            imageUrl: image.imageUrl,
            alt: image.alt,
            order: image.order
          });
        }
      }
      
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });
  
  app.put(`${apiRouter}/services/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(id, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(updatedService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });
  
  app.delete(`${apiRouter}/services/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      const deleted = await storage.deleteService(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });
  
  // Service Gallery Routes
  app.get(`${apiRouter}/services/:serviceId/gallery`, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      // Add detailed logging for debugging
      console.log(`[DEBUG] Fetching gallery for service ID: ${serviceId}`);
      
      const galleryImages = await storage.getServiceGallery(serviceId);
      
      console.log(`[DEBUG] Gallery images found: ${JSON.stringify(galleryImages)}`);
      
      res.json(galleryImages);
    } catch (error) {
      console.error(`[ERROR] Failed to fetch service gallery:`, error);
      res.status(500).json({ 
        message: "Failed to fetch service gallery", 
        error: String(error) 
      });
    }
  });
  
  app.post(`${apiRouter}/services/:serviceId/gallery`, isAdmin, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      // Check if service exists
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const galleryData = insertServiceGallerySchema.parse({
        ...req.body,
        serviceId
      });
      
      const galleryImage = await storage.addServiceGalleryImage(galleryData);
      res.status(201).json(galleryImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });
  
  app.put(`${apiRouter}/services/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const galleryData = insertServiceGallerySchema.partial().parse(req.body);
      const updatedImage = await storage.updateServiceGalleryImage(id, galleryData);
      
      if (!updatedImage) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });
  
  app.delete(`${apiRouter}/services/gallery/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery image ID" });
      }
      
      const deleted = await storage.deleteServiceGalleryImage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });
  
  // Testimonials Routes
  // Testimonials Public Routes
  app.get(`${apiRouter}/testimonials`, async (req: Request, res: Response) => {
    try {
      console.log("[DEBUG] Fetching approved testimonials");
      // Only return approved testimonials for public view
      const testimonials = await storage.getApprovedTestimonials();
      console.log("[DEBUG] Approved testimonials:", testimonials);
      res.json(testimonials);
    } catch (error) {
      console.error("[ERROR] Failed to fetch testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Submit a new testimonial (public)
  app.post(`${apiRouter}/testimonials/submit`, async (req: Request, res: Response) => {
    try {
      const testimonialData = publicTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json({ 
        message: "Thank you for your testimonial! It will be reviewed by our team before being published." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid testimonial data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit testimonial" });
    }
  });

  // Testimonial Admin Routes
  app.get(`${apiRouter}/admin/testimonials`, isAdmin, async (req: Request, res: Response) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.get(`${apiRouter}/admin/testimonials/pending`, isAdmin, async (req: Request, res: Response) => {
    try {
      const testimonials = await storage.getPendingTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending testimonials" });
    }
  });

  app.get(`${apiRouter}/admin/testimonials/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const testimonial = await storage.getTestimonial(id);
      
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(testimonial);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonial" });
    }
  });

  app.put(`${apiRouter}/admin/testimonials/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const testimonialData = insertTestimonialSchema.partial().parse(req.body);
      
      const updatedTestimonial = await storage.updateTestimonial(id, testimonialData);
      
      if (!updatedTestimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid testimonial data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.put(`${apiRouter}/admin/testimonials/:id/approve`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const approvedTestimonial = await storage.approveTestimonial(id);
      
      if (!approvedTestimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(approvedTestimonial);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve testimonial" });
    }
  });
  
  app.put(`${apiRouter}/admin/testimonials/:id/revoke`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const unapprovedTestimonial = await storage.revokeTestimonialApproval(id);
      
      if (!unapprovedTestimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(unapprovedTestimonial);
    } catch (error) {
      console.error("Error revoking approval:", error);
      res.status(500).json({ message: "Failed to revoke testimonial approval" });
    }
  });

  app.delete(`${apiRouter}/admin/testimonials/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTestimonial(id);
      
      if (!success) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });
  
  // Contact/Messages Routes
  app.post(`${apiRouter}/contact`, async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  app.get(`${apiRouter}/messages`, isAdmin, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.put(`${apiRouter}/messages/:id/read`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.markMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  app.delete(`${apiRouter}/messages/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const deleted = await storage.deleteMessage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // File Upload Route
  app.post(`${apiRouter}/upload`, isAdmin, upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = getFileUrl(req.file.filename);
      res.status(201).json({ 
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve static files from public directory
  app.use('/uploads', (req, res, next) => {
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    next();
  }, express.static(path.join(process.cwd(), 'public/uploads')));

  // Newsletter Subscriber Routes
  app.post(`${apiRouter}/newsletter/subscribe`, async (req: Request, res: Response) => {
    try {
      // Validate the input data
      const subscriberData = insertNewsletterSubscriberSchema.parse(req.body);
      
      // Check if email already exists
      const existingSubscriber = await storage.getNewsletterSubscriberByEmail(subscriberData.email);
      if (existingSubscriber) {
        // If already subscribed, return success
        if (existingSubscriber.subscribed) {
          return res.json({ message: "You are already subscribed to our newsletter" });
        }
        
        // If previously unsubscribed, resubscribe them
        const updatedSubscriber = await storage.updateNewsletterSubscriber(
          existingSubscriber.id, 
          { subscribed: true }
        );
        
        return res.json({ 
          message: "Welcome back! You have been resubscribed to our newsletter",
          subscriber: updatedSubscriber
        });
      }
      
      // Create new subscriber
      const subscriber = await storage.createNewsletterSubscriber(subscriberData);
      res.status(201).json({ 
        message: "Thank you for subscribing to our newsletter!",
        subscriber 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: error.errors 
        });
      }
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "Failed to process newsletter subscription" });
    }
  });
  
  app.post(`${apiRouter}/newsletter/unsubscribe`, async (req: Request, res: Response) => {
    try {
      // Validate that we have an email
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the subscriber
      const subscriber = await storage.getNewsletterSubscriberByEmail(email);
      if (!subscriber) {
        return res.status(404).json({ message: "Email not found in subscriber list" });
      }
      
      // Update the subscriber to unsubscribed
      const updatedSubscriber = await storage.updateNewsletterSubscriber(
        subscriber.id, 
        { subscribed: false }
      );
      
      res.json({ 
        message: "You have been unsubscribed from our newsletter",
        subscriber: updatedSubscriber
      });
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ message: "Failed to process unsubscribe request" });
    }
  });
  
  // Admin newsletter management
  app.get(`${apiRouter}/admin/newsletter/subscribers`, isAdmin, async (req: Request, res: Response) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch newsletter subscribers" });
    }
  });
  
  app.delete(`${apiRouter}/admin/newsletter/subscribers/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscriber ID" });
      }
      
      const success = await storage.deleteNewsletterSubscriber(id);
      if (!success) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });
  
  // Quote Request Routes
  app.post(`${apiRouter}/quote/request`, async (req: Request, res: Response) => {
    try {
      // Validate the input data
      const quoteData = insertQuoteRequestSchema.parse(req.body);
      
      // Create the quote request
      const quote = await storage.createQuoteRequest(quoteData);
      
      res.status(201).json({ 
        message: "Your quote request has been submitted successfully!",
        quote 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quote request data", 
          errors: error.errors 
        });
      }
      console.error("Quote request error:", error);
      res.status(500).json({ message: "Failed to process quote request" });
    }
  });
  
  // Admin quote request management
  app.get(`${apiRouter}/admin/quote/requests`, isAdmin, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuoteRequests();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });
  
  app.get(`${apiRouter}/admin/quote/requests/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      const quote = await storage.getQuoteRequest(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quote request" });
    }
  });
  
  app.put(`${apiRouter}/admin/quote/requests/:id/status`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Valid status values
      const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status value",
          validValues: validStatuses
        });
      }
      
      const quote = await storage.updateQuoteRequestStatus(id, status);
      if (!quote) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quote request status" });
    }
  });
  
  app.put(`${apiRouter}/admin/quote/requests/:id/reviewed`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      const quote = await storage.markQuoteRequestAsReviewed(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark quote request as reviewed" });
    }
  });
  
  app.delete(`${apiRouter}/admin/quote/requests/:id`, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      const success = await storage.deleteQuoteRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quote request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

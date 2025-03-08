import { eq, and, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  users, projects, projectGallery, blogCategories, blogTags, blogPosts, 
  blogPostCategories, blogPostTags,
  testimonials, services, messages,
  type User, type InsertUser, 
  type Project, type InsertProject,
  type ProjectGallery, type InsertProjectGallery,
  type BlogCategory, type InsertBlogCategory,
  type BlogTag, type InsertBlogTag, 
  type BlogPost, type InsertBlogPost, 
  type Testimonial, type InsertTestimonial, 
  type Service, type InsertService, 
  type Message, type InsertMessage
} from "../shared/schema";
import { IStorage } from "./storage";

export class DBStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.createdAt);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }

  async getFeaturedProjects(): Promise<Project[]> {
    try {
      const featuredProjects = await db.select().from(projects).where(eq(projects.featured, true));
      return featuredProjects;
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      return [];
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(projectUpdate)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    // First delete all gallery images for this project
    await this.deleteAllProjectGalleryImages(id);
    // Then delete the project
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
  
  // Project Gallery
  async getProjectGallery(projectId: number): Promise<ProjectGallery[]> {
    return db.select()
      .from(projectGallery)
      .where(eq(projectGallery.projectId, projectId))
      .orderBy(projectGallery.displayOrder);
  }
  
  async addProjectGalleryImage(galleryImage: InsertProjectGallery): Promise<ProjectGallery> {
    const result = await db.insert(projectGallery).values(galleryImage).returning();
    return result[0];
  }
  
  async updateProjectGalleryImage(id: number, galleryImageUpdate: Partial<InsertProjectGallery>): Promise<ProjectGallery | undefined> {
    const result = await db.update(projectGallery)
      .set(galleryImageUpdate)
      .where(eq(projectGallery.id, id))
      .returning();
    return result[0];
  }
  
  async deleteProjectGalleryImage(id: number): Promise<boolean> {
    const result = await db.delete(projectGallery).where(eq(projectGallery.id, id)).returning();
    return result.length > 0;
  }
  
  async deleteAllProjectGalleryImages(projectId: number): Promise<boolean> {
    const result = await db.delete(projectGallery)
      .where(eq(projectGallery.projectId, projectId))
      .returning();
    return result.length > 0;
  }

  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(blogPosts.createdAt);
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(blogPosts.createdAt);
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const results = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return results[0];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const results = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return results[0];
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const result = await db.insert(blogPosts).values(post).returning();
    return result[0];
  }

  async updateBlogPost(id: number, postUpdate: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const result = await db.update(blogPosts)
      .set(postUpdate)
      .where(eq(blogPosts.id, id))
      .returning();
    return result[0];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return result.length > 0;
  }
  
  // Blog Categories
  async getBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories);
  }
  
  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    const results = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return results[0];
  }
  
  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const result = await db.insert(blogCategories).values(category).returning();
    return result[0];
  }
  
  // Blog Tags
  async getBlogTags(): Promise<BlogTag[]> {
    return db.select().from(blogTags);
  }
  
  async getBlogTag(id: number): Promise<BlogTag | undefined> {
    const results = await db.select().from(blogTags).where(eq(blogTags.id, id));
    return results[0];
  }
  
  async createBlogTag(tag: InsertBlogTag): Promise<BlogTag> {
    const result = await db.insert(blogTags).values(tag).returning();
    return result[0];
  }
  
  // Blog Post Categories
  async getBlogPostCategories(postId: number): Promise<BlogCategory[]> {
    const results = await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description
      })
      .from(blogCategories)
      .innerJoin(blogPostCategories, 
        eq(blogCategories.id, blogPostCategories.categoryId))
      .where(eq(blogPostCategories.postId, postId));
      
    return results;
  }
  
  async linkBlogPostCategories(postId: number, categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) return;
    
    const values = categoryIds.map(categoryId => ({
      postId,
      categoryId
    }));
    
    await db.insert(blogPostCategories).values(values);
  }
  
  async updateBlogPostCategories(postId: number, categoryIds: number[]): Promise<void> {
    // Delete existing relationships
    await db.delete(blogPostCategories)
      .where(eq(blogPostCategories.postId, postId));
      
    // Add new relationships if any
    if (categoryIds.length > 0) {
      await this.linkBlogPostCategories(postId, categoryIds);
    }
  }
  
  // Blog Post Tags
  async getBlogPostTags(postId: number): Promise<BlogTag[]> {
    const results = await db
      .select({
        id: blogTags.id,
        name: blogTags.name,
        slug: blogTags.slug
      })
      .from(blogTags)
      .innerJoin(blogPostTags, 
        eq(blogTags.id, blogPostTags.tagId))
      .where(eq(blogPostTags.postId, postId));
      
    return results;
  }
  
  async linkBlogPostTags(postId: number, tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) return;
    
    const values = tagIds.map(tagId => ({
      postId,
      tagId
    }));
    
    await db.insert(blogPostTags).values(values);
  }
  
  async updateBlogPostTags(postId: number, tagIds: number[]): Promise<void> {
    // Delete existing relationships
    await db.delete(blogPostTags)
      .where(eq(blogPostTags.postId, postId));
      
    // Add new relationships if any
    if (tagIds.length > 0) {
      await this.linkBlogPostTags(postId, tagIds);
    }
  }

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials);
  }

  async getApprovedTestimonials(): Promise<Testimonial[]> {
    return db.select()
      .from(testimonials)
      .where(eq(testimonials.approved, true));
  }

  async getPendingTestimonials(): Promise<Testimonial[]> {
    return db.select()
      .from(testimonials)
      .where(eq(testimonials.approved, false));
  }

  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const results = await db.select()
      .from(testimonials)
      .where(eq(testimonials.id, id));
    return results[0];
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const result = await db.insert(testimonials)
      .values(testimonial)
      .returning();
    return result[0];
  }

  async updateTestimonial(id: number, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const results = await db.update(testimonials)
      .set(testimonialData)
      .where(eq(testimonials.id, id))
      .returning();
    return results[0];
  }

  async approveTestimonial(id: number): Promise<Testimonial | undefined> {
    const results = await db.update(testimonials)
      .set({ approved: true })
      .where(eq(testimonials.id, id))
      .returning();
    return results[0];
  }
  
  async revokeTestimonialApproval(id: number): Promise<Testimonial | undefined> {
    const results = await db.update(testimonials)
      .set({ approved: false })
      .where(eq(testimonials.id, id))
      .returning();
    return results[0];
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    const result = await db.delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning();
    return result.length > 0;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(services).values(service).returning();
    return result[0];
  }

  // Messages/Contact
  async getMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(messages.createdAt);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const results = await db.select().from(messages).where(eq(messages.id, id));
    return results[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages)
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
  }
}
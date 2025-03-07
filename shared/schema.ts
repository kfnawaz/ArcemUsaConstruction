import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(), // Main image (keeping for backward compatibility)
  featured: boolean("featured").default(false),
  
  // Project details from detail page
  overview: text("overview"),
  challenges: text("challenges"),
  solutions: text("solutions"),
  results: text("results"),
  
  // Project specifications
  client: text("client"),
  location: text("location"),
  size: text("size"),
  completionDate: text("completion_date"),
  servicesProvided: text("services_provided"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectGallery = pgTable("project_gallery", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertProjectGallerySchema = createInsertSchema(projectGallery).omit({
  id: true,
});

// Extended project schema that includes gallery images
export const extendedInsertProjectSchema = insertProjectSchema.extend({
  galleryImages: z.array(
    z.object({
      imageUrl: z.string(),
      caption: z.string().optional(),
      displayOrder: z.number().optional(),
    })
  ).optional(),
});

// Define project relations
export const projectsRelations = relations(projects, ({ many }) => ({
  galleryImages: many(projectGallery),
}));

export const projectGalleryRelations = relations(projectGallery, ({ one }) => ({
  project: one(projects, {
    fields: [projectGallery.projectId],
    references: [projects.id],
  }),
}));

// New table for blog categories
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
});

// New table for blog tags
export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  image: text("image").notNull(),
  author: text("author").notNull(),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // We'll keep the original category field for backward compatibility
  // but we'll also use the new relationships
  category: text("category").notNull(),
});

// Relation table for blog posts and categories (many-to-many)
export const blogPostCategories = pgTable("blog_post_categories", {
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => blogCategories.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.categoryId] }),
}));

// Relation table for blog posts and tags (many-to-many)
export const blogPostTags = pgTable("blog_post_tags", {
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.tagId] }),
}));

// Define relationships
export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  categories: many(blogPostCategories),
  tags: many(blogPostTags),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPostCategories),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  posts: many(blogPostTags),
}));

export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostCategories.postId],
    references: [blogPosts.id],
  }),
  category: one(blogCategories, {
    fields: [blogPostCategories.categoryId],
    references: [blogCategories.id],
  }),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

// Extend the schema to include categories and tags
export const extendedInsertBlogPostSchema = insertBlogPostSchema.extend({
  categoryIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  company: text("company"),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  image: text("image"),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  read: boolean("read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ExtendedInsertProject = z.infer<typeof extendedInsertProjectSchema>;
export type ProjectGallery = typeof projectGallery.$inferSelect;
export type InsertProjectGallery = z.infer<typeof insertProjectGallerySchema>;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type ExtendedInsertBlogPost = z.infer<typeof extendedInsertBlogPostSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

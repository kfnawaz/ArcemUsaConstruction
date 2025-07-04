import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, foreignKey, jsonb } from "drizzle-orm/pg-core";
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
  image: text("image").notNull(),
  featured: boolean("featured"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Additional details for individual project pages
  overview: text("overview"),
  challenges: text("challenges"),
  results: text("results"),
  
  // Project specifications
  client: text("client"),
  location: text("location"),
  size: text("size"),
  completionDate: text("completion_date"),
  servicesProvided: text("services_provided"),
});

export const projectGallery = pgTable("project_gallery", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0),
  isFeature: boolean("is_feature").default(false),
});

export const insertProjectGallerySchema = createInsertSchema(projectGallery).omit({
  id: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true
});

export const extendedInsertProjectSchema = insertProjectSchema.extend({
  galleryImages: z.array(
    z.object({
      imageUrl: z.string().url(),
      caption: z.string().optional(),
      displayOrder: z.number().optional(),
      isFeature: z.boolean().optional(),
    })
  ).optional(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  galleryImages: many(projectGallery),
}));

export const projectGalleryRelations = relations(projectGallery, ({ one }) => ({
  project: one(projects, {
    fields: [projectGallery.projectId],
    references: [projects.id]
  }),
}));

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true
});

export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  image: text("image"),
  author: text("author").notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  category: text("category").notNull().default(""), // Make it not null but with a default empty string
});

export const blogPostCategories = pgTable("blog_post_categories", {
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  categoryId: integer("category_id").notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
}, table => ({
  pk: primaryKey(table.postId, table.categoryId)
}));

export const blogPostTags = pgTable("blog_post_tags", {
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
}, table => ({
  pk: primaryKey(table.postId, table.tagId)
}));

export const blogGallery = pgTable("blog_gallery", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  order: integer("order").default(0),
});

export const insertBlogGallerySchema = createInsertSchema(blogGallery).omit({
  id: true
});

export const blogGalleryRelations = relations(blogGallery, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogGallery.postId],
    references: [blogPosts.id]
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  categories: many(blogPostCategories),
  tags: many(blogPostTags),
  gallery: many(blogGallery),
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
    references: [blogPosts.id]
  }),
  category: one(blogCategories, {
    fields: [blogPostCategories.categoryId],
    references: [blogCategories.id]
  })
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id]
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id]
  })
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true
});

export const extendedInsertBlogPostSchema = insertBlogPostSchema.extend({
  categoryIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
  galleryImages: z.array(
    z.object({
      imageUrl: z.string().url(),
      caption: z.string().optional(),
      order: z.number().optional(),
    })
  ).optional(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  company: text("company"),
  content: text("content").notNull(),
  email: text("email"),
  rating: integer("rating").default(5),
  image: text("image"),
  approved: boolean("approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true
});

export const publicTestimonialSchema = insertTestimonialSchema
  .omit({ approved: true });

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  features: text("features").array(),
});

export const serviceGallery = pgTable("service_gallery", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  order: integer("order").default(0),
  alt: text("alt"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true
});

export const insertServiceGallerySchema = createInsertSchema(serviceGallery).omit({
  id: true,
  createdAt: true
});

export const extendedInsertServiceSchema = insertServiceSchema.extend({
  galleryImages: z.array(
    z.object({
      imageUrl: z.string().url(),
      caption: z.string().optional(),
      order: z.number().optional(),
      alt: z.string().optional(),
    })
  ).optional(),
});

export const servicesRelations = relations(services, ({ many }) => ({
  galleryImages: many(serviceGallery),
}));

export const serviceGalleryRelations = relations(serviceGallery, ({ one }) => ({
  service: one(services, {
    fields: [serviceGallery.serviceId],
    references: [services.id]
  }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  subscribed: boolean("subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  source: text("source").default("website"), // website, manual, import, etc.
  preferences: jsonb("preferences"), // email preferences
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribed: true,
  createdAt: true
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  projectType: text("project_type").notNull(),
  projectSize: text("project_size"),
  budget: text("budget"),
  timeframe: text("timeframe"),
  description: text("description").notNull(),
  status: text("status").default("pending"),
  reviewed: boolean("reviewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  status: true,
  reviewed: true,
  createdAt: true
});

// Schema for file attachments in quote requests
export const fileAttachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileKey: z.string(),
  fileSize: z.number(),
  fileType: z.string()
});

// Extended schema that includes attachments for the frontend
export const quoteRequestWithAttachmentsSchema = insertQuoteRequestSchema.extend({
  attachments: z.array(fileAttachmentSchema).optional()
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;

// Quote request attachments table
export const quoteRequestAttachments = pgTable("quote_request_attachments", {
  id: serial("id").primaryKey(),
  quoteRequestId: integer("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(), // mime type or extension
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuoteRequestAttachmentSchema = createInsertSchema(quoteRequestAttachments).omit({
  id: true,
  createdAt: true
});

export type QuoteRequestAttachment = typeof quoteRequestAttachments.$inferSelect;
export type InsertQuoteRequestAttachment = z.infer<typeof insertQuoteRequestAttachmentSchema>;

// Define relations for quote requests and attachments
export const quoteRequestsRelations = relations(quoteRequests, ({ many }) => ({
  attachments: many(quoteRequestAttachments)
}));

export const quoteRequestAttachmentsRelations = relations(quoteRequestAttachments, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteRequestAttachments.quoteRequestId],
    references: [quoteRequests.id]
  })
}));

// Subcontractors table
export const subcontractors = pgTable("subcontractors", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  website: text("website"),
  serviceTypes: text("service_types").array(),
  serviceDescription: text("service_description").notNull(),
  yearsInBusiness: text("years_in_business").notNull(),
  insurance: boolean("insurance").default(false),
  bondable: boolean("bondable").default(false),
  licenses: text("licenses"),
  references: text("references"),
  howDidYouHear: text("how_did_you_hear"),
  status: text("status").default("pending"), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubcontractorSchema = createInsertSchema(subcontractors).omit({
  id: true,
  status: true,
  notes: true,
  createdAt: true
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  website: text("website"),
  supplyTypes: text("supply_types").array(),
  serviceDescription: text("service_description").notNull(),
  yearsInBusiness: text("years_in_business").notNull(),
  references: text("references"),
  howDidYouHear: text("how_did_you_hear"),
  status: text("status").default("pending"), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  status: true,
  notes: true,
  createdAt: true
});

export type Subcontractor = typeof subcontractors.$inferSelect;
export type InsertSubcontractor = z.infer<typeof insertSubcontractorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

// Careers/Jobs schema
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // full-time, part-time, contract, etc.
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  responsibilities: text("responsibilities").notNull(),
  benefits: text("benefits"),
  salary: text("salary"),
  applyUrl: text("apply_url"),
  active: boolean("active").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;

// Team Members schema
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  qualification: text("qualification").notNull(),
  gender: text("gender").notNull(), // 'male' or 'female'
  photo: text("photo"),
  bio: text("bio"),
  order: integer("order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// Site Settings Schema
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"),
  label: text("label").notNull(),
  description: text("description"),
  type: text("type").notNull().default("text"), // text, number, boolean, json, etc.
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingsSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ExtendedInsertProject = z.infer<typeof extendedInsertProjectSchema>;
export type ProjectGallery = typeof projectGallery.$inferSelect;
export type InsertProjectGallery = z.infer<typeof insertProjectGallerySchema>;

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

// Simplified interfaces to match actual database schema
export interface SimpleBlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;

// Simplified interface to match actual database schema
export interface SimpleBlogTag {
  id: number;
  name: string;
  slug: string;
}

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type ExtendedInsertBlogPost = z.infer<typeof extendedInsertBlogPostSchema>;
export type BlogGallery = typeof blogGallery.$inferSelect;
export type InsertBlogGallery = z.infer<typeof insertBlogGallerySchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type PublicTestimonial = z.infer<typeof publicTestimonialSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type ExtendedInsertService = z.infer<typeof extendedInsertServiceSchema>;
export type ServiceGallery = typeof serviceGallery.$inferSelect;
export type InsertServiceGallery = z.infer<typeof insertServiceGallerySchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// User Activity Tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text("session_token").notNull().unique(),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  logoutTime: timestamp("logout_time"),
  lastActiveTime: timestamp("last_active_time").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  loginTime: true,
  lastActiveTime: true,
  isActive: true,
});

// Feature Usage Tracking
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  featureName: text("feature_name").notNull(),
  action: text("action").notNull(), // create, update, delete, view, export, etc.
  entityType: text("entity_type"), // project, blog, service, etc.
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  duration: integer("duration"), // in milliseconds
  metadata: jsonb("metadata"), // additional context
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  timestamp: true,
});

// API Request Tracking
export const apiRequests = pgTable("api_requests", {
  id: serial("id").primaryKey(),
  method: text("method").notNull(),
  endpoint: text("endpoint").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  errorMessage: text("error_message"),
  requestSize: integer("request_size"), // in bytes
  responseSize: integer("response_size"), // in bytes
});

export const insertApiRequestSchema = createInsertSchema(apiRequests).omit({
  id: true,
  timestamp: true,
});

// Security Events Tracking
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // login_failed, password_reset, account_locked, etc.
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  severity: text("severity").notNull().default("low"), // low, medium, high, critical
  description: text("description"),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").default(false),
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  timestamp: true,
});

// System Alerts and Issues
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // performance, security, error, maintenance, etc.
  severity: text("severity").notNull().default("low"), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata"),
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  timestamp: true,
});

// Remove duplicate - newsletterSubscribers is already defined earlier in the file

// System Performance Metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  cpuUsage: integer("cpu_usage"), // percentage
  memoryUsage: integer("memory_usage"), // percentage
  diskUsage: integer("disk_usage"), // percentage
  activeConnections: integer("active_connections"),
  requestsPerSecond: integer("requests_per_second"),
  errorRate: integer("error_rate"), // percentage * 100
  averageResponseTime: integer("average_response_time"), // milliseconds
  uptime: integer("uptime"), // seconds
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  timestamp: true,
});

// Admin Actions Log
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text("action").notNull(),
  entityType: text("entity_type"), // user, project, blog, service, etc.
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  description: text("description"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  timestamp: true,
});

// Type exports for tracking tables
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;

export type ApiRequest = typeof apiRequests.$inferSelect;
export type InsertApiRequest = z.infer<typeof insertApiRequestSchema>;

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;

export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricsSchema>;

export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
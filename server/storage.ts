import {
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  blogPosts, type BlogPost, type InsertBlogPost,
  testimonials, type Testimonial, type InsertTestimonial,
  services, type Service, type InsertService,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getFeaturedProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Blog Posts
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Testimonials
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Messages/Contact
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private blogPosts: Map<number, BlogPost>;
  private testimonials: Map<number, Testimonial>;
  private services: Map<number, Service>;
  private messages: Map<number, Message>;
  
  userCurrentId: number;
  projectCurrentId: number;
  blogPostCurrentId: number;
  testimonialCurrentId: number;
  serviceCurrentId: number;
  messageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.blogPosts = new Map();
    this.testimonials = new Map();
    this.services = new Map();
    this.messages = new Map();
    
    this.userCurrentId = 1;
    this.projectCurrentId = 1;
    this.blogPostCurrentId = 1;
    this.testimonialCurrentId = 1;
    this.serviceCurrentId = 1;
    this.messageCurrentId = 1;
    
    // Add initial data
    this.initializeData();
  }

  // Initialize with sample data
  private initializeData() {
    // Add default services
    const defaultServices = [
      {
        title: "Commercial Construction",
        description: "From office buildings to retail spaces, we deliver commercial projects that meet the highest standards of quality and functionality.",
        icon: "building"
      },
      {
        title: "Residential Construction",
        description: "We build custom homes that reflect your personal style and needs, with attention to quality and detail in every aspect.",
        icon: "home"
      },
      {
        title: "Renovation & Remodeling",
        description: "Transform your existing space with our renovation services that enhance functionality, aesthetics, and value.",
        icon: "tool"
      },
      {
        title: "Project Planning & Design",
        description: "Our expert team provides comprehensive planning and design services to lay the foundation for successful project execution.",
        icon: "clipboard"
      },
      {
        title: "Industrial Construction",
        description: "We deliver industrial facilities built to the highest standards of safety, efficiency, and functionality.",
        icon: "factory"
      },
      {
        title: "Construction Management",
        description: "Our experienced project managers oversee every aspect of construction to ensure timely completion and budget adherence.",
        icon: "settings"
      }
    ];
    
    defaultServices.forEach(service => {
      this.createService(service as InsertService);
    });
    
    // Add sample projects
    const defaultProjects = [
      {
        title: "Eastside Corporate Center",
        category: "Commercial Office",
        description: "A modern glass office building featuring sustainable design elements and state-of-the-art facilities for a premier business environment.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        featured: true
      },
      {
        title: "The Westview Residences",
        category: "Residential Complex",
        description: "Luxury apartment complex with premium amenities, modern design, and comfortable living spaces in a desirable neighborhood.",
        image: "https://images.unsplash.com/photo-1613782558577-530a88a5790a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        featured: true
      },
      {
        title: "Summit Shopping Center",
        category: "Retail Development",
        description: "Modern retail space designed for optimal customer flow, featuring sustainable materials and energy-efficient systems.",
        image: "https://images.unsplash.com/photo-1565615833231-e8c91a38a012?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        featured: true
      },
      {
        title: "Grand Horizon Hotel",
        category: "Hospitality",
        description: "Elegant hotel featuring contemporary design with luxurious amenities, meeting spaces, and dining facilities for discerning travelers.",
        image: "https://images.unsplash.com/photo-1577942933954-ab8e992e20b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        featured: true
      },
      {
        title: "Northside Manufacturing Plant",
        category: "Industrial",
        description: "State-of-the-art manufacturing facility designed for optimal workflow, safety, and energy efficiency.",
        image: "https://images.unsplash.com/photo-1519558260268-cde7e03a0152?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        featured: true
      },
      {
        title: "Riverdale University Center",
        category: "Educational",
        description: "Modern educational facility featuring flexible learning spaces, advanced technology infrastructure, and sustainable design elements.",
        image: "https://images.unsplash.com/photo-1519687079572-8db97e023969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        featured: true
      }
    ];
    
    defaultProjects.forEach(project => {
      this.createProject(project as InsertProject);
    });
    
    // Add sample blog posts
    const defaultBlogPosts = [
      {
        title: "7 Sustainable Building Practices for Modern Construction",
        slug: "sustainable-building-practices",
        content: "Discover the latest sustainable building methods that are transforming the construction industry and reducing environmental impact...",
        excerpt: "Discover the latest sustainable building methods that are transforming the construction industry and reducing environmental impact.",
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        category: "Construction",
        author: "John Smith",
        published: true
      },
      {
        title: "The Evolution of Architectural Design in Commercial Buildings",
        slug: "evolution-architectural-design",
        content: "Explore how commercial architecture has evolved over the decades and what trends are shaping the future of building design...",
        excerpt: "Explore how commercial architecture has evolved over the decades and what trends are shaping the future of building design.",
        image: "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        category: "Architecture",
        author: "Emma Johnson",
        published: true
      },
      {
        title: "How Technology is Transforming the Construction Industry",
        slug: "technology-transforming-construction",
        content: "From BIM to drones and AI, discover how technological innovations are revolutionizing construction processes and outcomes...",
        excerpt: "From BIM to drones and AI, discover how technological innovations are revolutionizing construction processes and outcomes.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        category: "Technology",
        author: "Robert Chen",
        published: true
      }
    ];
    
    defaultBlogPosts.forEach(post => {
      this.createBlogPost(post as InsertBlogPost);
    });
    
    // Add sample testimonials
    const defaultTestimonials = [
      {
        name: "Michael Johnson",
        position: "CEO",
        company: "Johnson Enterprises",
        content: "ARCEMUSA exceeded all our expectations with our commercial building project. Their attention to detail, transparent communication, and exceptional craftsmanship made the entire process smooth and stress-free. The project was completed on time and within budget.",
        rating: 5,
        image: "https://randomuser.me/api/portraits/men/32.jpg"
      },
      {
        name: "Sarah Thompson",
        position: "Homeowner",
        company: "",
        content: "Working with ARCEMUSA on our custom home was a fantastic experience. They truly listened to our vision and brought it to life with exceptional craftsmanship. Their team was professional, responsive, and dedicated to quality at every step.",
        rating: 5,
        image: "https://randomuser.me/api/portraits/women/44.jpg"
      },
      {
        name: "David Wilson",
        position: "Owner",
        company: "Wilson Retail Group",
        content: "We hired ARCEMUSA for our retail space renovation, and the results were outstanding. Their innovative design solutions maximized our space and created an inviting environment for our customers. The team's expertise and professionalism were evident throughout the project.",
        rating: 5,
        image: "https://randomuser.me/api/portraits/men/55.jpg"
      }
    ];
    
    defaultTestimonials.forEach(testimonial => {
      this.createTestimonial(testimonial as InsertTestimonial);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getFeaturedProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.featured);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const now = new Date();
    const newProject: Project = { 
      ...project, 
      id, 
      createdAt: now,
      featured: project.featured ?? null 
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { 
      ...project, 
      ...projectUpdate 
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values());
  }
  
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).filter(post => post.published);
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.blogPostCurrentId++;
    const now = new Date();
    const newPost: BlogPost = { 
      ...post, 
      id, 
      createdAt: now,
      published: post.published ?? null 
    };
    this.blogPosts.set(id, newPost);
    return newPost;
  }
  
  async updateBlogPost(id: number, postUpdate: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost: BlogPost = { 
      ...post, 
      ...postUpdate 
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
  
  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialCurrentId++;
    const newTestimonial: Testimonial = { 
      ...testimonial, 
      id,
      image: testimonial.image ?? null,
      company: testimonial.company ?? null
    };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
  
  // Services
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceCurrentId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt: now, 
      read: false,
      phone: message.phone ?? null,
      service: message.service ?? null
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { 
      ...message, 
      read: true 
    };
    
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

// Import DBStorage
import { DBStorage } from "./dbStorage";

// Choose which storage implementation to use
// Use DBStorage for production, MemStorage for development if needed
export const storage = new DBStorage();

import { db } from "../../server/db";
import { projects } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function seedProjectsData() {
  try {
    console.log("Starting to seed projects data...");
    
    // Check if there are already projects in the database
    const projectCount = await db.select({ count: sql`count(*)` }).from(projects);
    
    if (projectCount[0].count !== '0') {
      console.log(`Found ${projectCount[0].count} existing projects. Skipping project insertion.`);
      return;
    }
    
    console.log("No existing projects found. Adding default projects...");
    
    // Define the projects data
    const projectsData = [
      {
        title: "Eastside Corporate Center",
        category: "Commercial",
        description: "A modern 12-story office building featuring sustainable design elements, flexible work spaces, and state-of-the-art technology infrastructure.",
        location: "Seattle, WA",
        client: "Eastside Developments LLC",
        architect: "Reed & Associates",
        startDate: "March 2023",
        completionDate: "June 2024",
        value: 28500000,
        size: 175000,
        scope: "New Construction",
        featured: true,
        image: "https://images.unsplash.com/photo-1577042939454-8b29bd23fe96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80"
      },
      {
        title: "Lakefront Residences",
        category: "Residential",
        description: "A luxury condominium development featuring 45 high-end units with lakefront views, premium finishes, and resort-style amenities.",
        location: "Chicago, IL",
        client: "Lakefront Properties",
        architect: "Urban Design Partners",
        startDate: "May 2023",
        completionDate: "August 2024",
        value: 32000000,
        size: 120000,
        scope: "New Construction",
        featured: true,
        image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
      },
      {
        title: "Grand Park Hotel",
        category: "Hospitality",
        description: "Elegant hotel featuring contemporary design with luxurious amenities, meeting spaces, and dining facilities for discerning travelers.",
        location: "Austin, TX",
        client: "Hospitality Group International",
        architect: "Modern Architects Inc",
        startDate: "February 2023",
        completionDate: "May 2024",
        value: 42000000,
        size: 210000,
        scope: "New Construction",
        featured: true,
        image: "https://images.unsplash.com/photo-1577942933954-ab8e992e20b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
      },
      {
        title: "Northside Manufacturing Plant",
        category: "Industrial",
        description: "State-of-the-art manufacturing facility designed for optimal workflow, safety, and energy efficiency.",
        location: "Detroit, MI",
        client: "Advanced Manufacturing Co.",
        architect: "Industrial Design Associates",
        startDate: "April 2023",
        completionDate: "July 2024",
        value: 35000000,
        size: 300000,
        scope: "New Construction",
        featured: true,
        image: "https://images.unsplash.com/photo-1519558260268-cde7e03a0152?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        createdAt: new Date()
      },
      {
        title: "Riverdale University Center",
        category: "Educational",
        description: "Modern educational facility featuring flexible learning spaces, advanced technology infrastructure, and sustainable design elements.",
        location: "Boston, MA",
        client: "Riverdale University",
        architect: "Educational Architects LLC",
        startDate: "June 2023",
        completionDate: "September 2024",
        value: 29000000,
        size: 150000,
        scope: "New Construction",
        featured: true,
        image: "https://images.unsplash.com/photo-1519687079572-8db97e023969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        createdAt: new Date()
      },
      {
        title: "Downtown Transit Hub",
        category: "Infrastructure",
        description: "Multi-modal transit center connecting bus, light rail, and commuter services with commercial space and sustainable design features.",
        location: "Philadelphia, PA",
        client: "City Transit Authority",
        architect: "Urban Infrastructure Design",
        startDate: "July 2023",
        completionDate: "November 2024",
        value: 47000000,
        size: 125000,
        scope: "New Construction",
        featured: false,
        image: "https://images.unsplash.com/photo-1577542104258-71d397662190?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80",
        createdAt: new Date()
      }
    ];
    
    // Insert the projects one by one
    for (const project of projectsData) {
      await db.insert(projects).values(project);
    }
    
    console.log(`Successfully inserted ${projectsData.length} projects`);
  } catch (error) {
    console.error("Error seeding projects data:", error);
  }
}

// Execute the function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedProjectsData().then(() => {
    console.log("Projects seeding completed!");
    process.exit(0);
  }).catch(err => {
    console.error("Error during projects seeding:", err);
    process.exit(1);
  });
}

export { seedProjectsData };
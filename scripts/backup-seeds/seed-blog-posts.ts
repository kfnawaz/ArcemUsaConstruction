import { db } from "../../server/db";
import { blogPosts, blogPostCategories, blogPostTags } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function seedBlogPostsData() {
  try {
    console.log("Starting to seed blog posts data...");
    
    // Check if there are already blog posts in the database
    const postsCount = await db.select({ count: sql`count(*)` }).from(blogPosts);
    
    if (postsCount[0].count !== '0') {
      console.log(`Found ${postsCount[0].count} existing blog posts. Skipping blog posts insertion.`);
      return;
    }
    
    console.log("No existing blog posts found. Adding default blog posts...");
    
    // Define the blog posts data
    const blogPostsData = [
      {
        title: "7 Sustainable Building Practices for Modern Construction",
        slug: "sustainable-building-practices-modern-construction",
        content: "<p>Sustainability in construction is no longer just a trend; it's becoming a standard practice in the industry. From reducing carbon footprints to creating healthier living and working environments, sustainable building practices offer numerous benefits for everyone involved.</p><h2>1. Energy-Efficient Design</h2><p>Modern buildings should be designed with energy efficiency in mind from the start. This includes proper orientation to maximize natural light, strategic window placement for passive heating and cooling, and well-insulated building envelopes that minimize energy loss.</p><h2>2. Renewable Energy Integration</h2><p>Incorporating renewable energy sources such as solar panels, wind turbines, or geothermal systems can significantly reduce a building's reliance on fossil fuels. These technologies continue to become more affordable and efficient, making them viable options for projects of all sizes.</p><h2>3. Sustainable Materials Selection</h2><p>Choosing materials with low environmental impact is crucial. This includes materials that are recycled, locally sourced, or rapidly renewable. Considerations should include the entire lifecycle of materials—from extraction and manufacturing to disposal or reuse.</p><h2>4. Water Conservation Strategies</h2><p>Implementing water-efficient fixtures, rainwater harvesting systems, and greywater recycling helps reduce water consumption. Drought-resistant landscaping further minimizes water needs for the property.</p><h2>5. Indoor Air Quality Enhancement</h2><p>The use of low-VOC (volatile organic compound) materials, proper ventilation systems, and biophilic design elements contributes to healthier indoor environments for occupants.</p><h2>6. Waste Reduction and Management</h2><p>Effective construction waste management includes reducing, reusing, and recycling materials whenever possible. This approach minimizes landfill waste and often reduces project costs.</p><h2>7. Smart Building Technologies</h2><p>Integrating automated systems that control lighting, HVAC, and other building functions optimizes energy use based on occupancy and needs, significantly enhancing efficiency over the building's lifetime.</p><p>Implementing these sustainable practices not only benefits the environment but also creates more valuable, healthier, and more efficient buildings that meet the growing demand for green construction.</p>",
        excerpt: "Discover seven key sustainable building practices that are shaping modern construction, from energy-efficient design to smart building technologies.",
        image: "https://images.unsplash.com/photo-1518707399486-6d702a84ff00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        author: "Jennifer Martinez",
        published: true,
        category: "Sustainable Building",
        publishedAt: new Date("2023-09-15"),
        createdAt: new Date()
      },
      {
        title: "The Evolution of Commercial Construction: Trends to Watch",
        slug: "evolution-commercial-construction-trends",
        content: "<p>The commercial construction industry is constantly evolving, with new trends emerging that shape how we approach projects. Understanding these developments is crucial for staying competitive and delivering maximum value to clients.</p><h2>Modular and Prefabricated Construction</h2><p>Modular construction continues to gain momentum in the commercial sector, with buildings being constructed off-site in controlled environments before being assembled on location. This approach reduces construction time by up to 50%, minimizes waste, and often results in higher quality due to standardized factory processes.</p><h2>Technology Integration</h2><p>Smart buildings are becoming the norm rather than the exception. Commercial spaces now routinely incorporate advanced systems for climate control, security, lighting, and communications. The Internet of Things (IoT) allows these systems to communicate with each other, optimizing building operations and reducing energy consumption.</p><h2>Focus on Occupant Experience</h2><p>Commercial buildings are increasingly designed with the end-user experience as a priority. This includes considerations for natural light, air quality, acoustic comfort, and spaces that promote wellness and productivity. The WELL Building Standard has emerged as a framework for creating spaces that enhance occupant health and well-being.</p><h2>Adaptive Reuse</h2><p>Rather than demolishing existing structures, many developers are choosing to repurpose them for new uses. This approach preserves architectural heritage, reduces construction waste, and often offers unique character that cannot be replicated in new buildings.</p><h2>Resilient Design</h2><p>With climate change concerns growing, commercial buildings are being designed to withstand extreme weather events and operate during power outages or other disruptions. Features like flood-resistant materials, backup power systems, and redundant mechanical systems are becoming standard considerations.</p><p>These trends reflect a broader shift toward more sustainable, efficient, and human-centered commercial construction. By embracing these developments, construction firms can deliver projects that not only meet current needs but are also adaptable for the future.</p>",
        excerpt: "Explore the latest trends reshaping commercial construction, from modular building techniques to technology integration and human-centered design approaches.",
        image: "https://images.unsplash.com/photo-1556156653-e5a7c69cc4f7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        author: "Marcus Johnson",
        published: true,
        category: "Commercial",
        publishedAt: new Date("2023-10-02"),
        createdAt: new Date()
      },
      {
        title: "How Technology is Transforming Construction Project Management",
        slug: "technology-transforming-construction-project-management",
        content: "<p>The construction industry, once known for its reluctance to adopt new technologies, is now experiencing a digital revolution that's transforming how projects are managed from conception to completion.</p><h2>Building Information Modeling (BIM)</h2><p>BIM has evolved from a design tool to a comprehensive platform for project management. By creating detailed 3D models that contain information about every component of a building, BIM facilitates better coordination among stakeholders, reduces errors, and improves decision-making throughout the project lifecycle.</p><h2>Drones and Site Monitoring</h2><p>Unmanned aerial vehicles (UAVs) are revolutionizing site surveys and progress monitoring. Drones can quickly capture detailed imagery of construction sites, create accurate topographical maps, and identify potential issues that might be difficult to spot from the ground. This technology improves safety, saves time, and provides valuable documentation of project progress.</p><h2>Mobile Applications and Cloud Computing</h2><p>Cloud-based project management software and mobile apps now allow real-time access to project information from anywhere. Field teams can update progress, report issues, and access plans instantly, while project managers can monitor activities, allocate resources, and communicate with stakeholders more efficiently.</p><h2>Augmented and Virtual Reality</h2><p>AR and VR technologies are changing how designs are presented and reviewed. Clients can experience spaces before they're built, potential design issues can be identified early, and workers can receive visual guidance for complex installation tasks, reducing errors and improving quality.</p><h2>Artificial Intelligence and Machine Learning</h2><p>AI is beginning to make inroads in construction management through predictive analytics for risk assessment, optimized scheduling, and resource allocation. Machine learning algorithms can analyze historical project data to forecast potential delays, cost overruns, and safety hazards, allowing for proactive management.</p><p>These technological advancements are not just improving efficiency; they're fundamentally changing how construction projects are planned, executed, and delivered. Companies that embrace these tools gain a significant competitive advantage through increased productivity, improved quality, and enhanced client satisfaction.</p>",
        excerpt: "From BIM to drones and AI, discover how technological innovations are revolutionizing construction processes and outcomes.",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        author: "Robert Chen",
        published: true,
        category: "Construction Technology",
        publishedAt: new Date("2023-10-20"),
        createdAt: new Date()
      }
    ];
    
    // Insert the blog posts one by one and record their IDs for relationships
    const insertedPostIds = [];
    for (const post of blogPostsData) {
      const result = await db.insert(blogPosts).values(post).returning({ id: blogPosts.id });
      insertedPostIds.push(result[0].id);
    }
    
    console.log(`Successfully inserted ${blogPostsData.length} blog posts`);
    
    // Now we should link blog posts to categories and tags
    // First, get the available categories and tags from the database
    const categories = await db.select().from(blogPostCategories);
    const tags = await db.select().from(blogPostTags);
    
    if (categories.length > 0 && tags.length > 0 && insertedPostIds.length > 0) {
      console.log("Adding blog post category and tag relationships...");
      
      // For the first post (Sustainable Building Practices)
      if (insertedPostIds[0]) {
        // Add categories for the post (if categories exist with those IDs)
        const categoriesForPost1 = [1, 4]; // Assuming IDs for "Technology" and "Sustainability"
        for (const categoryId of categoriesForPost1) {
          try {
            await db.insert(blogPostCategories).values({
              postId: insertedPostIds[0],
              categoryId: categoryId
            });
          } catch (error) {
            console.warn(`Couldn't link category ${categoryId} to post ${insertedPostIds[0]}: ${error.message}`);
          }
        }
        
        // Add tags for the post (if tags exist with those IDs)
        const tagsForPost1 = [3, 8]; // Assuming IDs for "Green Building" and "Design"
        for (const tagId of tagsForPost1) {
          try {
            await db.insert(blogPostTags).values({
              postId: insertedPostIds[0],
              tagId: tagId
            });
          } catch (error) {
            console.warn(`Couldn't link tag ${tagId} to post ${insertedPostIds[0]}: ${error.message}`);
          }
        }
      }
      
      // For the second post (Commercial Construction Trends)
      if (insertedPostIds[1]) {
        // Add categories for the post
        const categoriesForPost2 = [1, 5]; // Assuming IDs for "Construction" and "Industry News"
        for (const categoryId of categoriesForPost2) {
          try {
            await db.insert(blogPostCategories).values({
              postId: insertedPostIds[1],
              categoryId: categoryId
            });
          } catch (error) {
            console.warn(`Couldn't link category ${categoryId} to post ${insertedPostIds[1]}: ${error.message}`);
          }
        }
        
        // Add tags for the post
        const tagsForPost2 = [5, 9]; // Assuming IDs for "Commercial" and "Industry"
        for (const tagId of tagsForPost2) {
          try {
            await db.insert(blogPostTags).values({
              postId: insertedPostIds[1],
              tagId: tagId
            });
          } catch (error) {
            console.warn(`Couldn't link tag ${tagId} to post ${insertedPostIds[1]}: ${error.message}`);
          }
        }
      }
      
      // For the third post (Technology in Construction)
      if (insertedPostIds[2]) {
        // Add categories for the post
        const categoriesForPost3 = [6, 1]; // Assuming IDs for "Technology" and "Construction"
        for (const categoryId of categoriesForPost3) {
          try {
            await db.insert(blogPostCategories).values({
              postId: insertedPostIds[2],
              categoryId: categoryId
            });
          } catch (error) {
            console.warn(`Couldn't link category ${categoryId} to post ${insertedPostIds[2]}: ${error.message}`);
          }
        }
        
        // Add tags for the post
        const tagsForPost3 = [1, 9]; // Assuming IDs for "Construction" and "Industry"
        for (const tagId of tagsForPost3) {
          try {
            await db.insert(blogPostTags).values({
              postId: insertedPostIds[2],
              tagId: tagId
            });
          } catch (error) {
            console.warn(`Couldn't link tag ${tagId} to post ${insertedPostIds[2]}: ${error.message}`);
          }
        }
      }
      
      console.log("Blog post relationships added successfully");
    }
  } catch (error) {
    console.error("Error seeding blog posts data:", error);
  }
}

// Execute the function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedBlogPostsData().then(() => {
    console.log("Blog posts seeding completed!");
    process.exit(0);
  }).catch(err => {
    console.error("Error during blog posts seeding:", err);
    process.exit(1);
  });
}

export { seedBlogPostsData };
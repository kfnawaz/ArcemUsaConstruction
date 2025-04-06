import { seedProjectsData } from "./seed-projects";
import { seedBlogPostsData } from "./seed-blog-posts";
import { seedServicesData } from "./seed-services";

/**
 * Restores all essential data for the application.
 * This script restores projects, blog posts, and services data.
 */
async function restoreAllData() {
  try {
    console.log("=== Starting comprehensive data restoration ===");
    
    // First seed projects
    console.log("\n--- Restoring Projects Data ---");
    await seedProjectsData();
    
    // Then seed services
    console.log("\n--- Restoring Services Data ---");
    await seedServicesData();
    
    // Finally seed blog posts
    console.log("\n--- Restoring Blog Posts Data ---");
    await seedBlogPostsData();
    
    console.log("\n=== Data restoration completed successfully! ===");
  } catch (error) {
    console.error("Error during data restoration:", error);
    throw error;
  }
}

// Execute the function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  restoreAllData().then(() => {
    console.log("All data has been restored successfully!");
    process.exit(0);
  }).catch(err => {
    console.error("Error during data restoration:", err);
    process.exit(1);
  });
}

export { restoreAllData };
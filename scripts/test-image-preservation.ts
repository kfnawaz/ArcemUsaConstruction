import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import { FileManager } from "../server/utils/fileManager";

async function testImagePreservation() {
  console.log("Testing image preservation logic...");

  try {
    // 1. Create a dummy project
    const dummyImageUrl = "https://placekitten.com/800/600";
    const [project1] = await db.insert(schema.projects)
      .values({
        title: "Test Project 1",
        description: "Test description",
        category: "Commercial",
        image: dummyImageUrl // Image is required
      })
      .returning();
    
    console.log(`Created test project 1: ${project1.id}`);

    // 2. Create a dummy project 2
    const [project2] = await db.insert(schema.projects)
      .values({
        title: "Test Project 2",
        description: "Test description 2",
        category: "Residential",
        image: dummyImageUrl // Image is required
      })
      .returning();
    
    console.log(`Created test project 2: ${project2.id}`);

    // 3. Add the same image URL to both projects' galleries
    const sharedImageUrl = "https://example.com/shared-test-image.jpg";
    const uniqueImageUrl = "https://example.com/unique-test-image.jpg";
    
    // 4. Add shared image to project 1
    const [project1Gallery1] = await db.insert(schema.projectGallery)
      .values({
        projectId: project1.id,
        imageUrl: sharedImageUrl,
        caption: "Shared test image",
        displayOrder: 1,
        isFeature: false
      })
      .returning();
    
    console.log(`Added shared image to project 1: ${project1Gallery1.id}`);

    // 5. Add shared image to project 2
    const [project2Gallery1] = await db.insert(schema.projectGallery)
      .values({
        projectId: project2.id,
        imageUrl: sharedImageUrl,
        caption: "Shared test image",
        displayOrder: 1,
        isFeature: false
      })
      .returning();
    
    console.log(`Added shared image to project 2: ${project2Gallery1.id}`);

    // 6. Add unique image to project 1
    const [project1Gallery2] = await db.insert(schema.projectGallery)
      .values({
        projectId: project1.id,
        imageUrl: uniqueImageUrl,
        caption: "Unique test image",
        displayOrder: 2,
        isFeature: false
      })
      .returning();
    
    console.log(`Added unique image to project 1: ${project1Gallery2.id}`);

    // 7. Temporarily override the deleteFile function to log instead of actually delete
    const originalDeleteFile = FileManager.deleteFile;
    const deletedFiles: string[] = [];
    FileManager.deleteFile = async (url: string | null): Promise<boolean> => {
      if (url) {
        console.log(`Would delete file: ${url}`);
        deletedFiles.push(url);
      }
      return true;
    };

    // 8. Test deleting a gallery image from project 1
    console.log("\nTEST 1: Delete shared image from project 1");
    await db.delete(schema.projectGallery)
      .where(eq(schema.projectGallery.id, project1Gallery1.id))
      .execute();
    
    // 9. Now let's test our image preservation logic
    const storage = new DBStorage();
    
    // 10. Test deleting a unique image from project 1
    console.log("\nTEST 2: Delete unique image from project 1");
    await storage.deleteProjectGalleryImage(project1Gallery2.id);

    // 11. Test deleting all galleries from project 2
    console.log("\nTEST 3: Delete all gallery images from project 2");
    await storage.deleteAllProjectGalleryImages(project2.id);

    // 12. Check what files would have been deleted
    console.log("\nFILES THAT WOULD BE DELETED:");
    deletedFiles.forEach(file => console.log(`- ${file}`));

    // 13. Verify that shared image is not in the deleted files list
    const sharedImagePreserved = !deletedFiles.includes(sharedImageUrl);
    console.log(`\nSHARED IMAGE PRESERVED: ${sharedImagePreserved ? '✅ YES' : '❌ NO'}`);
    console.log(`UNIQUE IMAGE DELETED: ${deletedFiles.includes(uniqueImageUrl) ? '✅ YES' : '❌ NO'}`);

    // 14. Clean up test data
    await db.delete(schema.projectGallery)
      .where(eq(schema.projectGallery.projectId, project1.id))
      .execute();
    
    await db.delete(schema.projectGallery)
      .where(eq(schema.projectGallery.projectId, project2.id))
      .execute();
    
    await db.delete(schema.projects)
      .where(eq(schema.projects.id, project1.id))
      .execute();
    
    await db.delete(schema.projects)
      .where(eq(schema.projects.id, project2.id))
      .execute();

    // 15. Restore original deleteFile function
    FileManager.deleteFile = originalDeleteFile;

    console.log("\nTest completed and data cleaned up.");
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Import the DBStorage class
import { DBStorage } from "../server/dbStorage";

// Run the test
testImagePreservation().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
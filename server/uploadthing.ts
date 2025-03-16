import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";
// Import the Express-specific route handler for proper Express integration
import { createRouteHandler } from "uploadthing/express";
import type { Request, Response, Router } from "express";

const f = createUploadthing();

interface Session {
  userId?: number;
  role?: 'admin' | 'user';
}

// Define authentication function to handle permissions
const isAuthenticated = (req: Request) => {
  if (!req.session || !req.isAuthenticated()) {
    throw new UploadThingError("Unauthorized");
  }
  
  return {
    userId: req.user?.id,
    role: req.user?.role || 'user'
  } as Session;
};

// Define the file router with authentication and validation
export const uploadRouter = {
  // Define a route for image upload
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    // Set permissions and get metadata to identify the user
    .middleware(({ req }) => {
      try {
        // This code runs on your server before upload
        // Type assertion to solve type mismatch between Express.Request types
  const session = isAuthenticated(req as any);
        
        // Either throw or return the session
        if (session.role !== 'admin') {
          throw new UploadThingError("Only administrators can upload files");
        }
        
        console.log("Upload authorized for user:", session.userId);
        return { userId: session.userId };
      } catch (error) {
        console.error("Upload authorization error:", error);
        throw new UploadThingError("Authentication failed");
      }
    })
    // Define upload completion handler
    .onUploadComplete(({ metadata, file }) => {
      // This code runs on your server after upload
      console.log(`Upload complete from user ${metadata.userId}`);
      
      // Log both URL types for debugging
      console.log(`File URL (deprecated): ${file.url}`);
      console.log(`File URL (new): ${file.ufsUrl || 'Not available'}`);
      
      return { 
        url: file.url, // Keep for backwards compatibility
        ufsUrl: file.ufsUrl || file.url, // Prefer the new URL property
        key: file.key,
        name: file.name,
        size: file.size
      };
    }),
};

// Export route handlers for Express integration
export function createUploadthingExpressHandler(router: FileRouter) {
  // Create the route handler which returns an Express Router
  // The router already has all the necessary routes configured
  const uploadRouter = createRouteHandler({
    router,
  });
  
  // This function returns the Express router with preconfigured routes
  return uploadRouter;
}

// Export the fileRouter type for the frontend
export type OurFileRouter = typeof uploadRouter;
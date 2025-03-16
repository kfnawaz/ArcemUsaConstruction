import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";
import type { Request, Response } from "express";

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
      console.log(`File URL: ${file.url}`);
      
      return { 
        url: file.url,
        key: file.key,
        name: file.name,
        size: file.size
      };
    }),
};

// Export route handlers for Express integration
export function createUploadthingExpressHandler(router: FileRouter) {
  return {
    // POST endpoint that accepts multipart/form-data
    POST: async (req: Request, res: Response) => {
      try {
        console.log("UploadThing handling request");
        // Parse the multipart form data and handle the upload
        // Using type assertion to resolve type issues with FileRouter
        const result = await (router as any).handleUpload(req, res);
        console.log("UploadThing result:", result);
        return res.status(200).json(result);
      } catch (error: any) {
        console.error("UploadThing error:", error);
        const statusCode = error.status || error.statusCode || 500;
        const message = error.message || "Upload failed";
        return res.status(statusCode).json({ error: message });
      }
    },
  };
}

// Export the fileRouter type for the frontend
export type OurFileRouter = typeof uploadRouter;
import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";
import { Request, Response } from "express";

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
      // This code runs on your server before upload
      const session = isAuthenticated(req);
      
      // Either throw or return the session
      if (session.role !== 'admin') {
        throw new UploadThingError("Only administrators can upload files");
      }
      
      return { userId: session.userId };
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
        // Parse the multipart form data and handle the upload
        const result = await router.handleUpload(req, res);
        return res.status(200).json(result);
      } catch (error) {
        console.error("Uploadthing error:", error);
        return res.status(error.status || 500).json({ error: error.message });
      }
    },
  };
}

// Export the fileRouter type for the frontend
export type OurFileRouter = typeof uploadRouter;
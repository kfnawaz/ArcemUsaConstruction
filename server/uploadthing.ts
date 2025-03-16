import { createUploadthing, type FileRouter } from "uploadthing/express";
import type { Request } from "express";
import type { Session } from "express-session";

declare module "express-session" {
  interface Session {
    userId?: number;
    role?: 'admin' | 'user';
  }
}

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      // Check if the user is authenticated and has admin role
      const isAdmin = req.session?.role === 'admin';
      if (!isAdmin) throw new Error("Unauthorized: Admin access required");

      // Return metadata needed for file processing
      return { 
        userId: req.session?.userId 
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Log successful upload
      console.log("Upload completed:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        fileKey: file.key
      });

      // Return file details
      return { 
        url: file.url,
        key: file.key 
      };
    }),
} satisfies FileRouter;
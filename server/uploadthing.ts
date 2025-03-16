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

// FileRouter for your app, can contain multiple FileRoutes
export const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const isAdmin = req.session?.role === 'admin';

      // If you throw, the user will not be able to upload
      if (!isAdmin) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: req.session?.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
    }),
} satisfies FileRouter;
import { createUploadthing, type FileRouter } from "uploadthing/server";
import { db } from "./db";
import { Request } from "express";

// Extend Express Request to include session
declare module "express" {
  interface Request {
    session?: {
      userId?: number;
    };
  }
}

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const fileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(({ req }) => {
      // Check if user is authenticated
      if (!req.session?.userId) {
        throw new Error("Unauthorized");
      }

      // Return metadata to be stored with the file
      return { userId: req.session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { url: file.url };
    }),

  // File route for document uploads (PDF, DOCX, etc.)
  documentUploader: f({
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 1 }
  })
    .middleware(({ req }) => {
      if (!req.session?.userId) {
        throw new Error("Unauthorized");
      }
      return { userId: req.session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;
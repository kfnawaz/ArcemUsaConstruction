import { generateReactHelpers } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/server";
 
// Define the file router type to match the server definition
export type OurFileRouter = FileRouter & {
  imageUploader: {
    config: {
      maxFileSize: string;
      maxFileCount: number;
    };
    metadata: {
      userId?: number;
    };
    output: {
      url: string;
      key: string;
      name: string;
      size: number;
    }[];
  };
};

// Create the React hooks
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
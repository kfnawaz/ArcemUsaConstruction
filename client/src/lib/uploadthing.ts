import { generateReactHelpers } from "@uploadthing/react";
 
// Define the file router type
export type OurFileRouter = {
  imageUploader: {
    data: { userId?: number };
    file: {
      url: string;
      key: string;
      name: string;
      size: number;
    };
  };
};

// Create the React hooks
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
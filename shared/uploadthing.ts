import type { FileRouter } from "uploadthing/server";

export type OurFileRouter = FileRouter & {
  imageUploader: {
    config: {
      maxFileSize: string;
      maxFileCount: number;
    };
    metadata?: {
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
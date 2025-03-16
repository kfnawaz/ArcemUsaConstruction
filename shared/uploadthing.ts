import type { FileRouter } from "uploadthing/next";

export type OurFileRouter = FileRouter & {
  imageUploader: {
    config: {
      maxFileSize: string;
      maxFileCount: number;
    };
    metadata?: {
      type: "post" | "project" | "service" | "team" | "testimonial";
      id?: number;
    };
    output: {
      url: string;
      key: string;
      name: string;
      size: number;
    }[];
  };
};
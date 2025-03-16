import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@shared/uploadthing";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
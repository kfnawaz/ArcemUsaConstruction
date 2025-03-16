import { generateReactHelpers } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/next";

export const { useUploadThing } = generateReactHelpers<FileRouter>();
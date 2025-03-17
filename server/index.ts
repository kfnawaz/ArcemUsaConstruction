import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createUploadthing } from "uploadthing/server";
import { uploadRouter, createUploadthingExpressHandler } from "./uploadthing";
import { setupAuth } from "./auth";

// Set UploadThing environment variables
if (!process.env.UPLOADTHING_SECRET || !process.env.UPLOADTHING_APP_ID) {
  console.warn("Warning: UploadThing environment variables are not set properly.");
  console.warn("Make sure UPLOADTHING_SECRET and UPLOADTHING_APP_ID are available in the environment.");
} else {
  console.log("UploadThing credentials detected:", {
    appId: process.env.UPLOADTHING_APP_ID.substring(0, 4) + "..." // Only log a small part for security
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// First, set up authentication to ensure session is available
setupAuth(app);

// Then initialize the UploadThing route handler - this returns an Express router
// with all the necessary routes preconfigured
const uploadthingRouter = createUploadthingExpressHandler(uploadRouter);

// Mount the UploadThing router at the /api/uploadthing path
// This automatically adds all the required routes (POST, etc.)
app.use("/api/uploadthing", uploadthingRouter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error in Express middleware:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Prevent response if already sent
    if (!res.headersSent) {
      res.status(status).json({ 
        message, 
        error: process.env.NODE_ENV === 'production' ? undefined : String(err),
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
      });
    }
    
    // Don't throw the error as it crashes the server
    // throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try port 5000 first, then fallback to 5001 if necessary
  const tryListenOnPort = (portToTry: number) => {
    const serverInstance = server.listen({
      port: portToTry,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${portToTry}`);
    });
    
    serverInstance.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE' && portToTry === 5000) {
        console.log(`Port ${portToTry} in use, trying 5001...`);
        tryListenOnPort(5001);
      } else {
        console.error(`Failed to start server: ${e.message}`);
      }
    });
  };
  
  tryListenOnPort(5000);
})();

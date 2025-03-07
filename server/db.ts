import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Create postgres connection
const connectionString = process.env.DATABASE_URL || "";
const pool = postgres(connectionString, { max: 10 });

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for session store
export { pool };
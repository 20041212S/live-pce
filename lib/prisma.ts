import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Get the database URL and ensure it's properly formatted for Neon pooler
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // For Neon pooler, ensure proper connection string format
  // Neon pooler works with Prisma, but we need to ensure SSL and proper settings
  let databaseUrl = url.trim();
  
  // Parse URL to ensure proper formatting
  try {
    const urlObj = new URL(databaseUrl);
    
    // Ensure sslmode=require is set (required for Neon)
    if (!urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }
    
    // Remove channel_binding parameter if present - it's not standard and may cause issues
    // Prisma/PostgreSQL drivers may not support this parameter
    if (urlObj.searchParams.has('channel_binding')) {
      urlObj.searchParams.delete('channel_binding');
    }
    
    // For Neon pooler with Prisma, we don't need additional parameters
    // Prisma handles connection pooling automatically
    databaseUrl = urlObj.toString();
  } catch (e) {
    // If URL parsing fails, try to manually remove channel_binding
    // This is a fallback for malformed URLs
    if (databaseUrl.includes('channel_binding')) {
      databaseUrl = databaseUrl
        .replace(/[&?]channel_binding=[^&]*/g, '')
        .replace(/channel_binding=[^&]*&?/g, '');
    }
    console.warn('Could not parse DATABASE_URL, using fallback cleanup:', e);
  }
  
  return databaseUrl;
}

// Prisma Client configuration for serverless environments (Vercel)
// For Neon, the pooler connection string should work directly with Prisma
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// In production (Vercel serverless), we should reuse the client to avoid connection exhaustion
// Prisma Client is designed to be reused across requests in serverless environments
// This prevents creating too many database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Export as default for consistency (supports both import styles)
export default prisma;

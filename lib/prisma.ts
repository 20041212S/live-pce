import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
  });

// Cache the client in global scope (works for both dev and serverless environments like Vercel)
// In serverless, each function instance persists between invocations, so caching helps
globalForPrisma.prisma = prisma;

export default prisma;

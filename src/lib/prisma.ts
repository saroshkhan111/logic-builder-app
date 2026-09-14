import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const masked = dbUrl.replace(/:[^:@/]+@/, ':****@');
  console.log('[PRISMA] Using DATABASE_URL:', masked);
} else {
  console.log('[PRISMA] No DATABASE_URL env var set');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

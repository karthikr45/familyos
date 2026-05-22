import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';
export * from './repositories';

/**
 * Singleton PrismaClient.
 *
 * In development Next.js / Nest watch mode reloads modules frequently, which
 * would otherwise spawn a new client (and a new connection pool) on every
 * reload. We cache the instance on `globalThis` to avoid exhausting database
 * connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

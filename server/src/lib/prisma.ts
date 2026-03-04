import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL ?? 'postgresql://makteb:makteb_dev@localhost:5432/makteb';

export const prisma = new PrismaClient({
  datasourceUrl: url as any,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
} as any);

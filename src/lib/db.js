import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaLibSql({ url: 'file:dev.db' });
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;

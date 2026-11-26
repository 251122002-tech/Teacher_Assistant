import { Prisma, PrismaClient } from '@prisma/client';

// One client per process; Prisma keeps its own connection pool.
export const prisma = new PrismaClient();

export function isUniqueViolation(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

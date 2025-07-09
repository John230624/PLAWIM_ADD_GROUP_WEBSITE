// lib/prisma.js
import { PrismaClient } from '@prisma/client';

let prisma;

// Pour éviter de recréer de multiples instances de PrismaClient en développement avec le Hot Reloading de Next.js
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
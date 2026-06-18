import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function count() {
  const c = await prisma.item.count();
  console.log(`ITEMS EN LA BD: ${c}`);
  await prisma.$disconnect();
}

count();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sum = await prisma.customer.aggregate({
    where: { tenantId: 'tenant-demo' },
    _sum: { currentDebt: true }
  });
  console.log('CURRENT DEBT:', sum._sum.currentDebt);
}

main().catch(console.error).finally(() => prisma.$disconnect());

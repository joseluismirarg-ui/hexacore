import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.tenant.updateMany({
    data: {
      maxTrucks: 999
    }
  });
  console.log(`Updated ${result.count} tenants to maxTrucks = 999.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { trucks: true }
  });
  
  for (const t of tenants) {
    console.log(`Tenant: ${t.name} (ID: ${t.id})`);
    console.log(` - Max Trucks: ${t.maxTrucks}`);
    console.log(` - Current Trucks: ${t.trucks.length}`);
    if (t.trucks.length >= t.maxTrucks) {
      console.log(`   * REACHED LIMIT *`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

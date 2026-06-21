const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("Tenants:", tenants.map((t) => t.id));

  const tenant = tenants.find((t) => t.id !== 'default-tenant');
  if (tenant) {
    const tenantId = tenant.id;
    console.log("Checking tenantId:", tenantId);
    
    let license = await prisma.moduleLicense.findUnique({ where: { tenantId } });
    console.log("License found:", license);
    
    try {
      if (!license) {
        license = await prisma.moduleLicense.create({
          data: {
            tenantId,
            erpActive: true,
          }
        });
        console.log("Created license:", license);
      } else {
        license = await prisma.moduleLicense.update({
          where: { tenantId },
          data: {
            erpActive: !license.erpActive
          }
        });
        console.log("Updated license:", license);
      }
    } catch (e) {
      console.error("Prisma error:", e.code, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

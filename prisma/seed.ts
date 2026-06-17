import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Master Tenant
  const masterTenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: 'Hexa Core Master',
      industry: 'GENERAL',
      plan: 'ENTERPRISE',
      status: 'ACTIVE'
    }
  });

  // Master User
  const masterUser = await prisma.user.upsert({
    where: { email: 'admin@hexacore.com' },
    update: {},
    create: {
      email: 'admin@hexacore.com',
      name: 'Ingeniero Jefe',
      passwordHash: 'hashed_password_placeholder', // Should be hashed in real app
      role: 'ADMIN',
      tenantId: masterTenant.id
    }
  });

  console.log(`Creado master user: ${masterUser.email} para el tenant ${masterTenant.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

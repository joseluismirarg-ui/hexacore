import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTest() {
  const t = await prisma.tenant.findFirst();
  if (!t) return console.log("No tenant");
  
  await prisma.item.create({
    data: {
      sku: 'TEST-123',
      name: 'Producto de Prueba',
      cost: 10,
      price: 20,
      globalStock: 100,
      tenantId: t.id
    }
  });
  console.log("Producto creado");
  await prisma.$disconnect();
}

addTest();

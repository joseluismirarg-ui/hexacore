import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando recarga masiva de datos...');

  // 1. Asegurar Licencias
  await prisma.moduleLicense.upsert({
    where: { id: (await prisma.moduleLicense.findFirst())?.id || 'default' },
    update: { erpActive: true, hrActive: true, logisticsActive: true, manufacturingActive: true, treasuryActive: true },
    create: { erpActive: true, hrActive: true, logisticsActive: true, manufacturingActive: true, treasuryActive: true }
  });

  // 2. Crear Almacenes y Productos
  const almc1 = await prisma.warehouse.create({ data: { code: 'ALM-001', name: 'Bodega Central', location: 'Chihuahua' } });
  const prod1 = await prisma.product.create({ data: { name: 'Aceite Sintético 5W-30', sku: 'ACE-5W30', price: '120.00', cost: '80.00' } });
  
  await prisma.warehouseStock.create({ data: { warehouseId: almc1.id, productId: prod1.id, quantity: 500 } });
  console.log('📦 Productos y Almacenes inyectados.');

  // 3. Crear Empleados (RRHH)
  await prisma.employeeProfile.create({
    data: {
      user: { create: { email: faker.internet.email(), passwordHash: 'password123', name: 'Juan Vendedor', role: 'VENDEDOR' } },
      rfc: faker.string.alphanumeric(13),
      curp: faker.string.alphanumeric(18),
      phone: '6141234567',
      salaryBase: '15000.00',
      earnCommission: true
    }
  });
  console.log('👥 Empleados RRHH inyectados.');

  console.log('✅ Inyección completa. Refresca tu ERP.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando simulación de datos corporativos masivos...');

  // 1. Crear 5 Almacenes
  const almacenes = await Promise.all(Array.from({ length: 5 }).map(() => 
    prisma.warehouse.create({ data: { code: faker.string.alphanumeric(5).toUpperCase(), name: faker.location.city(), location: faker.location.streetAddress() } })
  ));

  // 2. Crear 50 Productos de Aceite y Aditivos
  const productos = await Promise.all(Array.from({ length: 50 }).map(() => 
    prisma.product.create({ data: { name: faker.commerce.productName(), sku: faker.string.uuid(), price: faker.commerce.price({ min: 100, max: 5000 }), cost: faker.commerce.price({ min: 50, max: 3000 }) } })
  ));

  // 3. Llenar Stocks iniciales
  for (const alm of almacenes) {
    for (const prod of productos) {
      await prisma.warehouseStock.create({ data: { warehouseId: alm.id, productId: prod.id, quantity: faker.number.int({ min: 0, max: 1000 }) } });
    }
  }

  // 4. Crear 20 Empleados
  for (let i = 0; i < 20; i++) {
    await prisma.employeeProfile.create({
      data: {
        user: { create: { email: faker.internet.email(), passwordHash: 'password123', name: faker.person.fullName(), role: 'VENDEDOR' } },
        rfc: faker.string.alphanumeric(13), curp: faker.string.alphanumeric(18),
        phone: faker.phone.number(), salaryBase: '12000.00', earnCommission: true
      }
    });
  }

  // 5. Crear 100 Movimientos Bancarios (Historial)
  const cuenta = await prisma.bankAccount.create({ data: { bankName: 'BBVA México', accountNumber: faker.finance.accountNumber(10), currentBalance: '1000000.00' } });
  for (let i = 0; i < 100; i++) {
    await prisma.bankMovement.create({
      data: { bankAccountId: cuenta.id, type: i % 2 === 0 ? 'DEPOSITO' : 'RETIRO', amount: faker.finance.amount(), concept: faker.lorem.sentence() }
    });
  }

  console.log('✅ Simulación masiva completada: 5 almacenes, 50 productos, 100 mov bancarios.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

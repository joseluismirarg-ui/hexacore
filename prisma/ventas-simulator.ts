import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando simulación de Ventas y Clientes...');

  // Obtener usuarios (vendedores) y productos existentes
  const users = await prisma.user.findMany({ where: { role: 'VENDEDOR' } });
  const products = await prisma.product.findMany();

  if (users.length === 0 || products.length === 0) {
    console.error('❌ Faltan usuarios o productos en la BD. Ejecuta full-simulator.ts primero.');
    return;
  }

  // 1. Crear 100 Clientes
  console.log('👥 Creando 100 clientes...');
  const customers = [];
  for (let i = 0; i < 100; i++) {
    const isCredit = Math.random() > 0.5;
    const creditLimit = isCredit ? faker.number.int({ min: 10000, max: 200000 }) : 0;
    const currentDebt = isCredit ? faker.number.int({ min: 0, max: creditLimit }) : 0;

    const customer = await prisma.customer.create({
      data: {
        companyName: faker.company.name(),
        rfc: faker.string.alphanumeric(12).toUpperCase(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        creditLimit: creditLimit.toString(),
        currentDebt: currentDebt.toString(),
      }
    });
    customers.push(customer);
  }

  // 2. Crear 500 Transacciones
  console.log('🛒 Creando 500 transacciones de venta...');
  let completedCount = 0;

  for (let i = 0; i < 500; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    const numItems = faker.number.int({ min: 1, max: 5 });
    let total = 0;
    const itemsData = [];

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const cantidad = faker.number.int({ min: 1, max: 20 });
      const precio = Number(product.price);
      total += cantidad * precio;
      
      itemsData.push({
        productId: product.id,
        cantidad,
        precioAplicado: precio.toString(),
      });
    }

    const isCompletado = Math.random() > 0.2;
    const isCredito = Number(customer.creditLimit) > 0 && Math.random() > 0.5;
    
    if (isCompletado) completedCount++;

    const transaction = await prisma.transaction.create({
      data: {
        tipo: isCredito ? 'CREDITO' : 'VENTA_DIRECTA',
        status: isCompletado ? 'COMPLETADO' : 'PENDIENTE',
        total: total.toString(),
        userId: user.id,
        customerId: customer.id,
        createdAt: faker.date.recent({ days: 30 }),
        items: {
          create: itemsData
        }
      }
    });

    // 3. Crear pagos para transacciones de VENTA_DIRECTA completadas
    if (transaction.status === 'COMPLETADO' && transaction.tipo === 'VENTA_DIRECTA') {
      await prisma.payment.create({
        data: {
          amount: total.toString(),
          method: 'EFECTIVO',
          customerId: customer.id,
          transactionId: transaction.id,
          date: transaction.createdAt,
        }
      });
    }

    // 4. Crear pagos aleatorios para reducir deuda
    if (transaction.tipo === 'CREDITO' && Math.random() > 0.5) {
      await prisma.payment.create({
        data: {
          amount: (total * Math.random()).toFixed(2),
          method: 'TRANSFERENCIA',
          customerId: customer.id,
          transactionId: transaction.id,
          date: faker.date.between({ from: transaction.createdAt, to: new Date() }),
        }
      });
    }

    // Opcional: Generar factura para algunas
    if (isCompletado && Math.random() > 0.7) {
      await prisma.invoice.create({
        data: {
          uuid_sat: faker.string.uuid(),
          rfc_receptor: customer.rfc || 'XAXX010101000',
          regimen_fiscal: '601',
          uso_cfdi: 'G03',
          status: 'TIMBRADA',
          createdAt: transaction.createdAt,
          transactionId: transaction.id,
          customerId: customer.id,
        }
      });
    }
  }

  // 5. Crear Movimientos de Kardex
  console.log('📦 Generando histórico de Kardex para las ventas (Omitido por ahora)...');

  console.log(`✅ Simulación completada: 100 Clientes y 500 Transacciones (${completedCount} completadas).`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

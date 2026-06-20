import { PrismaClient } from '@prisma/client';
import { fakerES_MX as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando simulación de 3 Meses para ElectroGlobal...');

  // El tenantId que vamos a usar en todas partes
  const tId = 'tenant-demo';

  // 1. Obtener el UUID del usuario admin existente de Supabase (demouser@hexacore.com)
  const authUsers = await prisma.$queryRaw<any[]>`SELECT id, email FROM auth.users WHERE email = 'demouser@hexacore.com' LIMIT 1;`;
  const adminId = authUsers.length > 0 ? authUsers[0].id : faker.string.uuid();

  // 2. Forzar a Supabase Auth a actualizar su JWT metadata para que apunte a nuestro tenant-demo
  if (authUsers.length > 0) {
    console.log('🔧 Actualizando tenantId en auth.users para demouser@hexacore.com...');
    await prisma.$executeRaw`UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{tenantId}', '"tenant-demo"') WHERE email = 'demouser@hexacore.com'`;
  }

  console.log('🏢 Creando o actualizando Tenant...');
  await prisma.tenant.upsert({
    where: { id: tId },
    update: {},
    create: {
      id: tId,
      name: 'ElectroGlobal S.A. de C.V.',
      industry: 'ELECTRONICS',
      plan: 'FREE',
      status: 'ACTIVE',
      systemConfigs: {
        create: {
          companyName: 'ElectroGlobal S.A. de C.V.',
          companyRfc: 'EGLO123456789',
          taxRegimen: '601', // General de Ley Personas Morales
        }
      },
      moduleLicense: {
        create: {
          erpActive: true,
          posActive: true,
          hrActive: true,
          billingActive: true,
          logisticsActive: true,
          manufacturingActive: true,
          treasuryActive: true,
          reportsActive: true,
          tmsActive: true,
        }
      }
    }
  });

  console.log('👥 Generando Empleados...');
  await prisma.user.create({
    data: { id: adminId, email: 'demouser@hexacore.com', name: 'Gerente General', role: 'ADMIN', tenantId: tId, isActive: true }
  });

  await prisma.user.create({
    data: { id: faker.string.uuid(), email: 'rh@electroglobal.com', name: 'Director RH', role: 'RH', tenantId: tId, isActive: true }
  });

  await prisma.user.create({
    data: { id: faker.string.uuid(), email: 'almacen@electroglobal.com', name: 'Jefe de Almacén', role: 'ALMACENISTA', tenantId: tId, isActive: true }
  });

  const vendedores = [];
  for (let i = 1; i <= 5; i++) {
    vendedores.push(await prisma.user.create({
      data: { id: faker.string.uuid(), email: `vendedor${i}@electroglobal.com`, name: `Vendedor ${faker.person.firstName()}`, role: 'VENDEDOR', tenantId: tId, isActive: true }
    }));
  }

  // Chofer (Logistics)
  await prisma.user.create({
    data: { id: faker.string.uuid(), email: 'logistica@electroglobal.com', name: 'Jefe Logística', role: 'ALMACENISTA', tenantId: tId, isActive: true }
  });

  console.log('🚚 Creando Flotilla y Rutas...');
  
  // Client for logistics trips
  const logisticsClient = await prisma.logisticsClient.create({
    data: {
      name: 'Cliente Logístico Externo',
      email: faker.internet.email(),
      tenantId: tId,
    }
  });

  const trucks = [];
  for (let i = 1; i <= 10; i++) {
    trucks.push(await prisma.truck.create({
      data: {
        plate: faker.vehicle.vrm(),
        model: `Camión de Reparto Mod ${faker.number.int({ min: 2018, max: 2024 })}`,
        tenantId: tId,
      }
    }));
  }

  const drivers = [];
  for (let i = 0; i < 5; i++) {
    drivers.push(await prisma.driver.create({
      data: {
        name: `Chofer ${faker.person.firstName()}`,
        licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
        phone: faker.phone.number(),
        tenantId: tId,
      }
    }));
  }

  console.log('📦 Generando Catálogo (130 SKUs)...');
  const catLaptops = await prisma.category.create({ data: { name: 'Laptops', tenantId: tId } });
  const catPhones = await prisma.category.create({ data: { name: 'Smartphones', tenantId: tId } });
  const catAudio = await prisma.category.create({ data: { name: 'Audio Profesional', tenantId: tId } });
  const catComp = await prisma.category.create({ data: { name: 'Componentes', tenantId: tId } });
  const categorias = [catLaptops, catPhones, catAudio, catComp];

  const mainLocation = await prisma.location.create({
    data: { name: 'CEDIS Principal', code: 'CEDIS-01', location: 'Ciudad de México', tenantId: tId }
  });

  const items = [];
  for (let i = 1; i <= 130; i++) {
    const cat = faker.helpers.arrayElement(categorias);
    const cost = faker.number.float({ min: 500, max: 15000, fractionDigits: 2 });
    const item = await prisma.item.create({
      data: {
        sku: `SKU-${cat.name.substring(0,3).toUpperCase()}-${faker.string.numeric(4)}`,
        name: `${cat.name} ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`,
        cost,
        price: cost * 1.4, // 40% margin
        globalStock: faker.number.int({ min: 50, max: 500 }),
        reorderPoint: faker.number.int({ min: 10, max: 30 }),
        categoryId: cat.id,
        tenantId: tId,
        inventories: {
          create: {
            locationId: mainLocation.id,
            quantity: faker.number.int({ min: 50, max: 500 }),
          }
        }
      }
    });
    items.push(item);
  }

  console.log('🏢 Generando Clientes (30 B2B)...');
  const customers = [];
  for (let i = 1; i <= 30; i++) {
    const limit = faker.number.int({ min: 50000, max: 300000 });
    customers.push(await prisma.customer.create({
      data: {
        companyName: faker.company.name() + ' S.A. de C.V.',
        rfc: faker.string.alphanumeric(12).toUpperCase(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        creditLimit: limit,
        currentDebt: 0,
        creditDays: faker.helpers.arrayElement([15, 30, 45, 60]),
        tenantId: tId,
      }
    }));
  }

  console.log('📈 Simulando Operación de 3 Meses (Ventas, Pagos, Entregas)...');
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let totalSales = 0;
  for (const customer of customers) {
    let customerDebt = 0;

    for (let o = 0; o < 30; o++) {
      const txDate = faker.date.between({ from: threeMonthsAgo, to: now });
      const vendedor = faker.helpers.arrayElement(vendedores);
      const itemsCount = faker.number.int({ min: 5, max: 15 });
      
      const selectedItems = faker.helpers.arrayElements(items, itemsCount);
      let totalAmount = 0;
      
      const transactionItemsData = selectedItems.map(item => {
        const qty = faker.number.int({ min: 1, max: 20 });
        const subtotal = Number(item.price) * qty;
        totalAmount += subtotal;
        return {
          itemId: item.id,
          cantidad: qty,
          precioAplicado: item.price
        };
      });

      const tx = await prisma.transaction.create({
        data: {
          tipo: 'CREDITO',
          status: 'COMPLETADO',
          total: totalAmount,
          createdAt: txDate,
          userId: vendedor.id,
          customerId: customer.id,
          tenantId: tId,
          items: {
            create: transactionItemsData
          }
        }
      });

      const invoice = await prisma.invoice.create({
        data: {
          uuid_sat: faker.string.uuid(),
          rfc_receptor: customer.rfc || 'XAXX010101000',
          regimen_fiscal: '601',
          uso_cfdi: 'G03',
          forma_pago: '99',
          metodo_pago: 'PPD',
          status: 'TIMBRADA',
          createdAt: txDate,
          transactionId: tx.id,
          customerId: customer.id,
          tenantId: tId,
        }
      });

      const isPaid = faker.number.int({ min: 1, max: 100 }) <= 90;
      if (isPaid) {
        const payDate = new Date(txDate.getTime() + faker.number.int({ min: 1, max: customer.creditDays }) * 24 * 60 * 60 * 1000);
        
        await prisma.payment.create({
          data: {
            amount: totalAmount,
            method: 'TRANSFERENCIA',
            date: payDate,
            customerId: customer.id,
            transactionId: tx.id,
            tenantId: tId,
            allocations: {
              create: {
                invoiceId: invoice.id,
                amount: totalAmount,
                tenantId: tId
              }
            }
          }
        });
      } else {
        customerDebt += totalAmount;
      }

      totalSales++;
      
      if (totalSales % 100 === 0) {
        console.log(`  -> Generadas ${totalSales} ventas...`);
      }
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { currentDebt: customerDebt }
    });
  }

  console.log('🚧 Generando Gastos Operativos (Trip Expenses)...');
  for (let i = 0; i < 50; i++) {
    const truck = faker.helpers.arrayElement(trucks);
    const driver = faker.helpers.arrayElement(drivers);
    const date = faker.date.between({ from: threeMonthsAgo, to: now });

    const trip = await prisma.trip.create({
      data: {
        tripId: `TRP-${faker.string.numeric(5)}`,
        cargoDescription: 'Electrónicos Varios',
        originAddress: 'CEDIS Principal',
        destinationAddress: faker.location.streetAddress(),
        departureDateTime: date,
        clientId: logisticsClient.id,
        truckId: truck.id,
        driverId: driver.id,
        tenantId: tId,
      }
    });

    await prisma.tripExpense.createMany({
      data: [
        { tripId: trip.id, expenseType: 'FUEL', amount: faker.number.float({ min: 800, max: 2500, fractionDigits: 2 }), date, tenantId: tId },
        { tripId: trip.id, expenseType: 'TOLLS', amount: faker.number.float({ min: 200, max: 600, fractionDigits: 2 }), date, tenantId: tId }
      ]
    });
  }

  console.log('✅ Simulación completada con éxito!');
  console.log(`📊 Tenant: ElectroGlobal S.A. de C.V.`);
  console.log(`📊 Total Ventas Generadas: ${totalSales}`);
  console.log(`📊 Clientes: ${customers.length}`);
  console.log(`📊 SKUs: ${items.length}`);
  console.log(`📊 Camiones: ${trucks.length}`);
  console.log(`\n🔑 Puedes iniciar sesión con: demouser@hexacore.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

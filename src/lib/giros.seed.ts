import { PrismaClient } from '@prisma/client';

export const seedIndustryTemplates = async (prisma: PrismaClient, tenantId: string, industry: string) => {
  const templates: Record<string, { categories: string[], defaultUoM: string, items: { name: string, sku: string, price: number }[] }> = {
    CONSTRUCTION: {
      categories: ['Aceros', 'Cementos', 'Herramientas', 'Agregados'],
      defaultUoM: 'Ton',
      items: [
        { name: 'Cemento Cruz Azul 50kg', sku: 'CEM-CA-50', price: 150 },
        { name: 'Varilla Corrugada 3/8"', sku: 'VAR-38', price: 120 },
      ]
    },
    RETAIL: {
      categories: ['Electrónica', 'Ropa', 'Hogar', 'Juguetes'],
      defaultUoM: 'Pza',
      items: [
        { name: 'Smartphone Genérico 64GB', sku: 'SMART-64', price: 3500 },
        { name: 'Camiseta Algodón M', sku: 'CAM-ALG-M', price: 250 },
      ]
    },
    SERVICES: {
      categories: ['Consultoría', 'Mantenimiento', 'Soporte', 'Suscripciones'],
      defaultUoM: 'Hora',
      items: [
        { name: 'Hora de Consultoría IT', sku: 'CONS-IT-1H', price: 1000 },
        { name: 'Mantenimiento Preventivo A/C', sku: 'MANT-AC-PREV', price: 1500 },
      ]
    },
    MANUFACTURING: {
      categories: ['Materias Primas', 'Ensambles', 'Refacciones', 'Empaque'],
      defaultUoM: 'Kg',
      items: [
        { name: 'Resina Plástica ABS', sku: 'RES-ABS', price: 50 },
        { name: 'Tornillo M4 x 10mm', sku: 'TORN-M4-10', price: 2 },
      ]
    },
    FOOD: {
      categories: ['Lácteos', 'Carnes', 'Verduras', 'Abarrotes'],
      defaultUoM: 'Kg',
      items: [
        { name: 'Queso Oaxaca Premium', sku: 'QUE-OAX-P', price: 120 },
        { name: 'Carne Molida Sirloin', sku: 'CAR-MOL-SIR', price: 180 },
      ]
    },
    GENERAL: {
      categories: ['General'],
      defaultUoM: 'Pza',
      items: [
        { name: 'Artículo de Prueba', sku: 'ART-TEST', price: 100 },
      ]
    }
  };

  const selectedTemplate = templates[industry] || templates['GENERAL'];

  console.log(`[Seed] Inyectando template de ${industry} para Tenant: ${tenantId}`);

  // Create Location (Bodega Principal)
  const location = await prisma.location.create({
    data: {
      name: 'Bodega Principal',
      code: 'MAIN-BOD',
      tenantId
    }
  });

  // Create Categories and Items
  for (const catName of selectedTemplate.categories) {
    const category = await prisma.category.create({
      data: {
        name: catName,
        tenantId
      }
    });

    // We assign all template items to the first category just to populate
    if (catName === selectedTemplate.categories[0]) {
      for (const item of selectedTemplate.items) {
        const createdItem = await prisma.item.create({
          data: {
            name: item.name,
            sku: item.sku,
            cost: item.price * 0.5,
            categoryId: category.id,
            price: item.price,
            tenantId
          }
        });

        // Initialize inventory
        await prisma.inventory.create({
          data: {
            quantity: 100, // Stock inicial de 100
            itemId: createdItem.id,
            locationId: location.id
          }
        });
      }
    }
  }

  console.log(`[Seed] Catálogo de ${industry} inyectado exitosamente.`);
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  const tenants = await prisma.tenant.findMany();
  console.log("Tenants actuales:", tenants.map(t => t.id));

  // Obtener el ID del Tenant ElectroGlobal
  const electroGlobal = tenants.find(t => t.name.includes('ElectroGlobal'));
  
  if (electroGlobal) {
    console.log("ElectroGlobal ID encontrado:", electroGlobal.id);
    
    // Obtener los usuarios de Supabase en caso de que existan para forzar que el tenantId de ElectroGlobal 
    // sea el mismo que el que tenga tu usuario en la Nube.
    // Como no podemos saber el tenantId exacto de Supabase desde aquí, vamos a imprimir las credenciales.
    console.log("Por favor usa el usuario: demouser@hexacore.com y si no ves la info, revisa qué tenantId devuelve la API de login.");
  }
}

fix().finally(() => prisma.$disconnect());

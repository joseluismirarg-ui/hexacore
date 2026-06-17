import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding Hexa Core Systems...");

  // Almacén Central — singleton requerido por la lógica de negocio
  const almacenCentral = await prisma.inventoryLocation.upsert({
    where: {
      // No tiene unique compuesto natural, usar findFirst en prod
      unique_consignacion_cliente: {
        tipo: "ALMACEN_CENTRAL",
        customer_id: null as unknown as string,
      },
    },
    update: {},
    create: {
      nombre: "Almacén Central",
      tipo: "ALMACEN_CENTRAL",
    },
  });
  console.log(`Almacén Central: ${almacenCentral.id}`);

  // Usuario Admin inicial
  const adminHash = crypto
    .createHash("sha256")
    .update("admin_temp_password")
    .digest("hex");

  const admin = await prisma.user.upsert({
    where: { email: "admin@hexacore.mx" },
    update: {},
    create: {
      nombre: "Administrador",
      apellido: "Sistema",
      email: "admin@hexacore.mx",
      password_hash: adminHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin user: ${admin.id}`);

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

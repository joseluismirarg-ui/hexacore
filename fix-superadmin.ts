import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"SUPERADMIN"') WHERE email IN ('superadmin@hexacore.com', 'superadmin@gmail.com');`);
  console.log('Roles actualizados en Supabase Auth.');
}
main();

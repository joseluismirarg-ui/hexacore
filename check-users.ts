import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.$queryRawUnsafe(`SELECT id, email, raw_user_meta_data FROM auth.users;`);
  console.log(users);
}
main();

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDelete() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@hexacore.com' } });
  if (!admin) return console.log('Admin not found');

  const token = jwt.sign(
    { userId: admin.id, role: admin.role, tenantId: admin.tenantId },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    { expiresIn: '1h' }
  );

  const res = await fetch('http://localhost:3000/api/products/invalido123', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
}

testDelete();

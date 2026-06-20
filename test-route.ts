import express from 'express';
import adminRoutes from './src/routes/admin.routes';

const app = express();
app.use(express.json());

// Mock authenticateToken
const authenticateToken = (req: any, res: any, next: any) => {
  req.user = { id: 'admin', role: 'ADMIN', tenantId: 'default-tenant' };
  next();
};

app.use('/api/admin', authenticateToken, adminRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Not found in API catchall' });
});

import request from 'supertest';

(async () => {
  console.log("Testing PUT /api/admin/tenants/clxm13v7b000213d2f9o9o603/licenses");
  const res = await request(app).put('/api/admin/tenants/clxm13v7b000213d2f9o9o603/licenses').send({ erpActive: false });
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY:`, res.body);
})();

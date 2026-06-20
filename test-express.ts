import express from 'express';
import adminRoutes from './src/routes/admin.routes';
import { errorHandler } from './src/middleware/errorHandler';

const app = express();
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  req.user = { id: 'admin', role: 'ADMIN', tenantId: 'default-tenant' };
  next();
};

app.use('/api/admin', authenticateToken, adminRoutes);
app.use(errorHandler);

const req = {
  method: 'PUT',
  url: '/api/admin/tenants/clxm13v7b000213d2f9o9o603/licenses',
  params: {},
  body: { erpActive: false },
  headers: {}
} as any;

const res = {
  status: (code: number) => {
    console.log(`STATUS: ${code}`);
    return res;
  },
  json: (data: any) => {
    console.log(`JSON:`, data);
    return res;
  }
} as any;

app(req, res, () => {
  console.log('App Next called, route not matched');
});

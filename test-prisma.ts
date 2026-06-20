import express, { Request, Response, NextFunction } from 'express';
import { prisma } from './src/lib/prisma';
import { errorHandler } from './src/middleware/errorHandler';

const app = express();
app.use(express.json());

app.put('/api/admin/tenants/:id/licenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.params.id;
    let license = await prisma.moduleLicense.findUnique({ where: { tenantId } });
    if (!license) {
      license = await prisma.moduleLicense.create({
        data: {
          tenantId,
          erpActive: true,
          posActive: true,
          hrActive: false,
          billingActive: false,
          logisticsActive: false,
          manufacturingActive: false,
          treasuryActive: false,
          reportsActive: false,
        },
      });
    }
    res.json({ success: true, data: license });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

const req = {} as any;
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

(async () => {
  try {
    const tenantId = "non-existent-tenant-id";
    let license = await prisma.moduleLicense.findUnique({ where: { tenantId } });
    if (!license) {
      license = await prisma.moduleLicense.create({
        data: {
          tenantId,
        },
      });
    }
    console.log(license);
  } catch (e: any) {
    console.log('ERROR THROWN:', e.code, e.constructor.name);
    errorHandler(e, req, res, (() => {}) as any);
  }
})();

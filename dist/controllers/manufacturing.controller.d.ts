import { Request, Response, NextFunction } from 'express';
export declare class ManufacturingController {
    static getBOMs(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createBOM(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getWorkOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    static startWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    static completeWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=manufacturing.controller.d.ts.map
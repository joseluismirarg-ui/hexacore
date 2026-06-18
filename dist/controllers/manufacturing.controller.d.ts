import { Request, Response, NextFunction } from 'express';
export declare class ManufacturingController {
    static getBOMs(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createBOM(req: Request, res: Response, next: NextFunction): Promise<void>;
    static processProductionOrder(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=manufacturing.controller.d.ts.map
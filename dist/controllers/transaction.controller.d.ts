import { Request, Response, NextFunction } from "express";
import { EventEmitter } from "events";
export declare const wsEmitter: EventEmitter<[never]>;
export declare function registrarTransaccion(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTransaccion(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listarTransacciones(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function solicitarAutorizacion(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function webhookWhatsAppAutorizacion(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=transaction.controller.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryController = void 0;
const client_1 = require("@prisma/client");
const string_math_utils_1 = require("../utils/string-math.utils");
const prisma = new client_1.PrismaClient();
class TreasuryController {
    static async createMovement(req, res, next) {
        try {
            const { bankAccountId, type, amount, concept } = req.body;
            const amountString = amount.toString().trim();
            const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
            if (!account) {
                res.status(404).json({ error: 'Cuenta no encontrada' });
                return;
            }
            const isCredit = ['DEPOSITO', 'INTERES'].includes(type);
            const isDebit = ['RETIRO', 'TRANSFERENCIA', 'COMISION'].includes(type);
            let newBalance;
            if (isCredit) {
                newBalance = string_math_utils_1.StringMath.add(account.currentBalance, amountString);
            }
            else if (isDebit) {
                if (string_math_utils_1.StringMath.compare(account.currentBalance, amountString) < 0) {
                    res.status(400).json({ error: 'Saldo insuficiente' });
                    return;
                }
                newBalance = string_math_utils_1.StringMath.subtract(account.currentBalance, amountString);
            }
            else {
                res.status(400).json({ error: 'Tipo inválido' });
                return;
            }
            const result = await prisma.$transaction(async (tx) => {
                const movement = await tx.bankMovement.create({ data: { bankAccountId, type, amount: amountString, concept } });
                await tx.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: newBalance } });
                return movement;
            });
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TreasuryController = TreasuryController;
//# sourceMappingURL=treasury.controller.js.map
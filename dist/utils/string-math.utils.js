"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringMath = void 0;
class StringMath {
    static toCents(value) {
        const cleaned = value.trim().replace(/[^0-9.\-]/g, '');
        return Math.round(parseFloat(cleaned) * 100);
    }
    static fromCents(cents) {
        return (cents / 100).toFixed(2);
    }
    static add(a, b) { return this.fromCents(this.toCents(a) + this.toCents(b)); }
    static subtract(a, b) { return this.fromCents(this.toCents(a) - this.toCents(b)); }
    static multiply(a, multiplier) { return this.fromCents(Math.round(this.toCents(a) * parseFloat(multiplier.trim()))); }
    static isPositive(value) { return this.toCents(value) > 0; }
    static isZero(value) { return this.toCents(value) === 0; }
    static compare(a, b) { return this.toCents(a) - this.toCents(b); }
}
exports.StringMath = StringMath;
//# sourceMappingURL=string-math.utils.js.map
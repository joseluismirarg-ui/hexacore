export class StringMath {
  private static toCents(value: string): number {
    const cleaned = value.trim().replace(/[^0-9.\-]/g, '');
    return Math.round(parseFloat(cleaned) * 100);
  }
  private static fromCents(cents: number): string {
    return (cents / 100).toFixed(2);
  }
  static add(a: string, b: string): string { return this.fromCents(this.toCents(a) + this.toCents(b)); }
  static subtract(a: string, b: string): string { return this.fromCents(this.toCents(a) - this.toCents(b)); }
  static multiply(a: string, multiplier: string): string { return this.fromCents(Math.round(this.toCents(a) * parseFloat(multiplier.trim()))); }
  static isPositive(value: string): boolean { return this.toCents(value) > 0; }
  static isZero(value: string): boolean { return this.toCents(value) === 0; }
  static compare(a: string, b: string): number { return this.toCents(a) - this.toCents(b); }
}

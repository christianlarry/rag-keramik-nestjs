import { InvalidStockQuantityError } from '../errors';

export class StockQuantity {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new InvalidStockQuantityError(
        this.value,
        'Stock quantity must be an integer',
      );
    }

    if (this.value < 0) {
      throw new InvalidStockQuantityError(
        this.value,
        'Stock quantity cannot be negative',
      );
    }
  }

  public static create(quantity: number): StockQuantity {
    return new StockQuantity(quantity);
  }

  public static zero(): StockQuantity {
    return new StockQuantity(0);
  }

  public getValue(): number {
    return this.value;
  }

  public add(amount: number): StockQuantity {
    return StockQuantity.create(this.value + amount);
  }

  public subtract(amount: number): StockQuantity {
    return StockQuantity.create(this.value - amount);
  }

  public isZero(): boolean {
    return this.value === 0;
  }

  public isGreaterThanOrEqual(quantity: number): boolean {
    return this.value >= quantity;
  }

  public equals(other: StockQuantity): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}

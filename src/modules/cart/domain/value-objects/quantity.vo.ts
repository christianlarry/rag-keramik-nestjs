import { InvalidQuantityError } from '../errors';

export class Quantity {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new InvalidQuantityError(this.value, 'Quantity must be an integer');
    }

    if (this.value <= 0) {
      throw new InvalidQuantityError(
        this.value,
        'Quantity must be greater than 0',
      );
    }

    if (this.value > 9999) {
      throw new InvalidQuantityError(
        this.value,
        'Quantity cannot exceed 9999',
      );
    }
  }

  public static create(quantity: number): Quantity {
    return new Quantity(quantity);
  }

  public getValue(): number {
    return this.value;
  }

  public add(amount: number): Quantity {
    return Quantity.create(this.value + amount);
  }

  public subtract(amount: number): Quantity {
    return Quantity.create(this.value - amount);
  }

  public equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  public isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}

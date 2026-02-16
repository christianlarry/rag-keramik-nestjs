import { InvalidPriceError } from '../errors';

export class Price {
  private readonly amount: number;
  private readonly currency: string;

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
    this.validate();
  }

  private validate(): void {
    if (this.amount < 0) {
      throw new InvalidPriceError(this.amount, 'Price cannot be negative');
    }

    if (!Number.isFinite(this.amount)) {
      throw new InvalidPriceError(
        this.amount,
        'Price must be a valid number',
      );
    }

    // Validate currency code (ISO 4217)
    const validCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
    if (!validCurrencies.includes(this.currency)) {
      throw new InvalidPriceError(
        this.amount,
        `Invalid currency code: ${this.currency}`,
      );
    }
  }

  public static create(amount: number, currency = 'IDR'): Price {
    // Round to 2 decimal places
    const rounded = Math.round(amount * 100) / 100;
    return new Price(rounded, currency);
  }

  public getAmount(): number {
    return this.amount;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public equals(other: Price): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  public isGreaterThan(other: Price): boolean {
    if (this.currency !== other.currency) {
      throw new InvalidPriceError(
        this.amount,
        'Cannot compare prices with different currencies',
      );
    }
    return this.amount > other.amount;
  }

  public isLessThan(other: Price): boolean {
    if (this.currency !== other.currency) {
      throw new InvalidPriceError(
        this.amount,
        'Cannot compare prices with different currencies',
      );
    }
    return this.amount < other.amount;
  }

  public add(other: Price): Price {
    if (this.currency !== other.currency) {
      throw new InvalidPriceError(
        this.amount,
        'Cannot add prices with different currencies',
      );
    }
    return Price.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Price): Price {
    if (this.currency !== other.currency) {
      throw new InvalidPriceError(
        this.amount,
        'Cannot subtract prices with different currencies',
      );
    }
    return Price.create(this.amount - other.amount, this.currency);
  }

  public multiply(multiplier: number): Price {
    return Price.create(this.amount * multiplier, this.currency);
  }

  public toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

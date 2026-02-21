import { DomainError } from './domain-error.base';

class InvalidMoneyError extends DomainError {
  readonly code = 'INVALID_MONEY';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Money Value Object — Shared Kernel
 *
 * Represents a monetary amount with currency.
 * Used across Order, Payment, and Discount bounded contexts.
 */
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
    this.validate();
  }

  private validate(): void {
    if (!Number.isFinite(this.amount)) {
      throw new InvalidMoneyError('Amount must be a valid number');
    }

    if (this.amount < 0) {
      throw new InvalidMoneyError('Amount cannot be negative');
    }

    const validCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
    if (!validCurrencies.includes(this.currency)) {
      throw new InvalidMoneyError(`Invalid currency code: ${this.currency}`);
    }
  }

  public static create(amount: number, currency = 'IDR'): Money {
    const rounded = Math.round(amount * 100) / 100;
    return new Money(rounded, currency);
  }

  public static zero(currency = 'IDR'): Money {
    return new Money(0, currency);
  }

  public getAmount(): number {
    return this.amount;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public isZero(): boolean {
    return this.amount === 0;
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  public isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  public isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  public isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  public multiply(multiplier: number): Money {
    if (!Number.isFinite(multiplier)) {
      throw new InvalidMoneyError('Multiplier must be a valid number');
    }
    return Money.create(this.amount * multiplier, this.currency);
  }

  public percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new InvalidMoneyError('Percentage must be between 0 and 100');
    }
    return Money.create((this.amount * percent) / 100, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvalidMoneyError(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  public toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

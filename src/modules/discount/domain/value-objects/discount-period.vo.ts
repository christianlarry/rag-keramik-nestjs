import { InvalidDiscountPeriodError } from '../errors';

/**
 * DiscountPeriod Value Object
 *
 * Encapsulates the start and end date of a discount validity period.
 */
export class DiscountPeriod {
  private readonly startDate: Date;
  private readonly endDate: Date;

  private constructor(startDate: Date, endDate: Date) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.validate();
  }

  private validate(): void {
    if (
      !(this.startDate instanceof Date) ||
      isNaN(this.startDate.getTime())
    ) {
      throw new InvalidDiscountPeriodError('Start date is invalid');
    }

    if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
      throw new InvalidDiscountPeriodError('End date is invalid');
    }

    if (this.endDate <= this.startDate) {
      throw new InvalidDiscountPeriodError(
        'End date must be after start date',
      );
    }
  }

  public static create(startDate: Date, endDate: Date): DiscountPeriod {
    return new DiscountPeriod(startDate, endDate);
  }

  public getStartDate(): Date {
    return this.startDate;
  }

  public getEndDate(): Date {
    return this.endDate;
  }

  /**
   * Check if the discount is currently within its validity period
   */
  public isCurrentlyValid(now: Date = new Date()): boolean {
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Check if the discount has expired
   */
  public hasExpired(now: Date = new Date()): boolean {
    return now > this.endDate;
  }

  /**
   * Check if the discount has not started yet
   */
  public hasNotStarted(now: Date = new Date()): boolean {
    return now < this.startDate;
  }

  /**
   * Get remaining time in milliseconds (0 if expired)
   */
  public getRemainingTime(now: Date = new Date()): number {
    if (this.hasExpired(now)) return 0;
    return this.endDate.getTime() - now.getTime();
  }

  public equals(other: DiscountPeriod): boolean {
    return (
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate.getTime() === other.endDate.getTime()
    );
  }

  public toString(): string {
    return `${this.startDate.toISOString()} - ${this.endDate.toISOString()}`;
  }
}

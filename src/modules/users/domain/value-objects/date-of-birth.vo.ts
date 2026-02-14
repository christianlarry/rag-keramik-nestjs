import { InvalidDateOfBirthError } from "../errors";

export class DateOfBirth {
  private readonly value: Date;

  private static readonly MAX_AGE_YEARS = 120;
  private static readonly MIN_AGE_YEARS = 0;

  private constructor(date: Date) {
    this.value = date;
    this.validate();
  }

  private validate(): void {
    // Ensure that dateOfBirth is not in the future
    if (this.value > new Date()) {
      throw new InvalidDateOfBirthError('Date of birth cannot be in the future.');
    }

    // Ensure that dateOfBirth indicates age of at least 0 years
    const ageDifMs = Date.now() - this.value.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < DateOfBirth.MIN_AGE_YEARS) {
      throw new InvalidDateOfBirthError('Date of birth indicates invalid age.');
    }

    // Ensure that dateOfBirth is not below 120 years ago
    const now = new Date();
    const oldestValidDate = new Date(
      now.getFullYear() - DateOfBirth.MAX_AGE_YEARS,
      now.getMonth(),
      now.getDate()
    );
    if (this.value < oldestValidDate) {
      throw new InvalidDateOfBirthError(
        `Date of birth indicates age greater than ${DateOfBirth.MAX_AGE_YEARS} years.`
      );
    }
  }

  public static create(date: Date): DateOfBirth {
    return new DateOfBirth(date);
  }

  public static fromString(dateString: string): DateOfBirth {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      throw new InvalidDateOfBirthError('Invalid date format provided.');
    }

    return new DateOfBirth(date);
  }

  public getValue(): Date {
    return this.value;
  }

  public getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.value.getFullYear();
    const monthDiff = today.getMonth() - this.value.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.value.getDate())) {
      age--;
    }

    return age;
  }

  public isAdult(adultAge: number = 18): boolean {
    return this.getAge() >= adultAge;
  }

  public equals(other: DateOfBirth): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  public toString(): string {
    return this.value.toISOString();
  }

  public toDateString(): string {
    return this.value.toISOString().split('T')[0];
  }
}

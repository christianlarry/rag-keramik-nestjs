import { InvalidNameError } from "../errors/invalid-name.error";

export class Name {
  private readonly firstName: string;
  private readonly lastName: string;

  private constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;

    this.validate();
  }

  private validate() {
    if (!this.firstName || this.firstName.trim().length === 0) {
      // TODO : Create Custom Error
      throw new InvalidNameError('First name cannot be empty');
    }
    if (!this.lastName || this.lastName.trim().length === 0) {
      // TODO : Create Custom Error
      throw new InvalidNameError('Last name cannot be empty');
    }
    if (this.firstName.length > 50) {
      // TODO : Create Custom Error
      throw new InvalidNameError('First name cannot exceed 50 characters');
    }
    if (this.lastName.length > 50) {
      // TODO : Create Custom Error
      throw new InvalidNameError('Last name cannot exceed 50 characters');
    }
  }

  public static create(firstName: string, lastName: string): Name {
    return new Name(firstName, lastName);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public getInitials(): string {
    return `${this.firstName.charAt(0).toUpperCase()}${this.lastName.charAt(0).toUpperCase()}`;
  }

  public getFirstLastInitial(): string {
    return `${this.firstName} ${this.lastName.charAt(0).toUpperCase()}.`;
  }

  public getLastFirstInitial(): string {
    return `${this.lastName}, ${this.firstName.charAt(0).toUpperCase()}.`;
  }

  public getValue(): { firstName: string; lastName: string } {
    return {
      firstName: this.firstName,
      lastName: this.lastName
    };
  }

  public equals(other: Name): boolean {
    return this.firstName === other.firstName && this.lastName === other.lastName;
  }
}
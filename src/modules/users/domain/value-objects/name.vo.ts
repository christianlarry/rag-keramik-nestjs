import { InvalidNameError } from "../errors/invalid-name.error";

export class Name {
  private readonly fullName: string;

  private constructor(
    fullName: string
  ) {
    this.fullName = fullName;

    this.validate();
  }

  private validate() {
    // Display name validation
    if (this.fullName.trim().length === 0) { throw new InvalidNameError('Full name cannot be empty'); }
    if (this.fullName.length > 100) { throw new InvalidNameError('Full name cannot exceed 100 characters'); }
  }

  public static create(fullName: string): Name {
    return new Name(fullName);
  }

  public getFullName(): string {
    return this.fullName;
  }

  public getFirstName(): string {
    return this.fullName.split(' ')[0];
  }

  public getLastName(): string {
    if (this.fullName.split(' ').length === 1) return this.fullName; // If there's only one name, return it as the last name

    return this.fullName.split(' ').slice(1).join(' ');
  }

  public getInitials(): string {
    if (this.fullName.split(' ').length === 1) return this.fullName.charAt(0).toUpperCase(); // If there's only one name, return its initial

    return this.fullName.split(' ').map(name => name.charAt(0).toUpperCase()).join('');
  }

  public equals(other: Name): boolean {
    return this.fullName === other.fullName;
  }
}
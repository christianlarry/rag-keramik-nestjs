import { InvalidNameError } from "../errors/invalid-name.error";

export class Name {
  private readonly fullName: string;

  private readonly NAME_REGEX: RegExp = /^[a-zA-Zà-žÀ-Ž'´`-]{1,}([ ][a-zA-Zà-žÀ-Ž'´`-]{1,})+$/; // Allows letters (including accented), spaces, apostrophes, and hyphens

  private constructor(
    fullName: string
  ) {
    this.validate(fullName);

    this.fullName = this.sanitaize(fullName);
  }

  private validate(fullName: string) {
    // Display name validation
    if (fullName.trim().length === 0) { throw new InvalidNameError('Full name cannot be empty'); }
    if (fullName.trim().length < 2) { throw new InvalidNameError('Full name must be at least 2 characters long'); }
    if (fullName.trim().length > 100) { throw new InvalidNameError('Full name cannot exceed 100 characters'); }
    if (!this.NAME_REGEX.test(fullName)) { throw new InvalidNameError('Full name contains invalid characters or format'); }
  }

  private sanitaize(fullName: string): string {
    let sanitized: string = fullName;

    sanitized = sanitized.trim().replace(/\s+/g, ' '); // Trim and replace multiple spaces with a single space
    sanitized = sanitized.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '); // Capitalize first letter of each word

    return sanitized;
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
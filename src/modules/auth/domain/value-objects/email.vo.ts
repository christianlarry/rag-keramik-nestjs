import { EmailFormatInvalidError } from "../exceptions/email/email-format-invalid.error";

export class Email {
  private constructor(private readonly value: string) {
    Object.freeze(this); // Make the instance immutable
  }

  static create(
    email: string
  ): Email {

    // Email Validation (simple regex for demonstration purposes)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new EmailFormatInvalidError();
    }

    // Normalize email to lowercase
    const loweredEmail = email.toLowerCase().trim();

    return new Email(loweredEmail);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
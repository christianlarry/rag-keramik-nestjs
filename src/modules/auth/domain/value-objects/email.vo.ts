import { EmailFormatInvalidError } from "src/modules/users/domain/errors";

export class Email {
  private constructor(
    public readonly value: string,
  ) { }

  public static create(
    email: string
  ): Email {

    // Email Validation (simple regex for demonstration purposes)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new EmailFormatInvalidError();
    }

    return new Email(email);
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
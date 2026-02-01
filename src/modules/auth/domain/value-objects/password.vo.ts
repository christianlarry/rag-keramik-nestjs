import { PasswordTooWeakError } from "../exceptions";
import { PasswordHasher } from "../hasher/password-hasher.interface";

export class Password {
  private constructor(private readonly value: string) {
    Object.freeze(this); // Make the instance immutable
  }

  static create(raw: string, hasher: PasswordHasher): Password {
    // Validation logic for password strength can be added here
    if (raw.length < 8) {
      throw new PasswordTooWeakError();
    }
    // At least one number
    if (/\d/.test(raw) === false) {
      throw new PasswordTooWeakError();
    }
    // At least one uppercase letter
    if (/[A-Z]/.test(raw) === false) {
      throw new PasswordTooWeakError();
    }
    // At least one lowercase letter
    if (/[a-z]/.test(raw) === false) {
      throw new PasswordTooWeakError();
    }
    // At least one special character
    if (/[\W_]/.test(raw) === false) {
      throw new PasswordTooWeakError();
    }

    // Hash the password
    const hashedPassword = hasher.hash(raw);
    return new Password(hashedPassword);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  compare(plainText: string, hasher: PasswordHasher): Promise<boolean> {
    return hasher.compare(plainText, this.value);
  }
}
import { InvalidPhoneNumberError } from "../errors";

export class PhoneNumber {
  private readonly value: string;

  private constructor(phoneNumber: string) {
    this.value = phoneNumber;
    this.validate();
  }

  private validate(): void {
    // Remove spaces, dashes, and parentheses for validation
    const cleaned = this.value.replace(/[\s\-()]/g, '');

    // Check if contains only digits and optional + prefix
    if (!/^\+?\d+$/.test(cleaned)) {
      throw new InvalidPhoneNumberError('Phone number must contain only digits and optional + prefix.');
    }

    // Check minimum length (at least 8 digits)
    const digitsOnly = cleaned.replace('+', '');
    if (digitsOnly.length < 8) {
      throw new InvalidPhoneNumberError('Phone number must contain at least 8 digits.');
    }

    // Check maximum length (max 15 digits based on E.164 standard)
    if (digitsOnly.length > 15) {
      throw new InvalidPhoneNumberError('Phone number cannot exceed 15 digits.');
    }

    // Additional validation for Indonesian phone numbers
    if (cleaned.startsWith('+62') || cleaned.startsWith('62')) {
      const indonesianNumber = cleaned.replace(/^\+?62/, '');

      // Indonesian mobile numbers should start with 8 and have 9-12 digits after country code
      if (indonesianNumber.startsWith('8')) {
        if (indonesianNumber.length < 9 || indonesianNumber.length > 12) {
          throw new InvalidPhoneNumberError('Indonesian mobile number must have 9-12 digits after country code.');
        }
      }
      // Indonesian landline numbers
      else if (indonesianNumber.length < 8 || indonesianNumber.length > 11) {
        throw new InvalidPhoneNumberError('Indonesian landline number must have 8-11 digits after country code.');
      }
    }
  }

  public static create(phoneNumber: string): PhoneNumber {
    return new PhoneNumber(phoneNumber);
  }

  public getValue(): string {
    return this.value;
  }

  /**
   * Get phone number in E.164 format (with + prefix)
   */
  public getE164Format(): string {
    const cleaned = this.value.replace(/[\s\-()]/g, '');

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If starts with 0, assume Indonesian number
    if (cleaned.startsWith('0')) {
      return `+62${cleaned.substring(1)}`;
    }

    // If starts with 62, add +
    if (cleaned.startsWith('62')) {
      return `+${cleaned}`;
    }

    // Otherwise return as is with +
    return `+${cleaned}`;
  }

  /**
   * Get phone number in local format (without country code)
   */
  public getLocalFormat(): string {
    const cleaned = this.value.replace(/[\s\-()]/g, '');

    if (cleaned.startsWith('+62')) {
      return `0${cleaned.substring(3)}`;
    }

    if (cleaned.startsWith('62') && !cleaned.startsWith('620')) {
      return `0${cleaned.substring(2)}`;
    }

    return cleaned;
  }

  /**
   * Get phone number with formatting (e.g., 0812-3456-7890)
   */
  public getFormattedValue(): string {
    const local = this.getLocalFormat();

    // Format Indonesian mobile numbers
    if (local.startsWith('08')) {
      if (local.length === 11) {
        return `${local.substring(0, 4)}-${local.substring(4, 7)}-${local.substring(7)}`;
      } else if (local.length === 12) {
        return `${local.substring(0, 4)}-${local.substring(4, 8)}-${local.substring(8)}`;
      } else if (local.length === 13) {
        return `${local.substring(0, 4)}-${local.substring(4, 8)}-${local.substring(8)}`;
      }
    }

    return local;
  }

  public isIndonesianNumber(): boolean {
    const cleaned = this.value.replace(/[\s\-()]/g, '');
    return cleaned.startsWith('+62') || cleaned.startsWith('62') || cleaned.startsWith('0');
  }

  public equals(other: PhoneNumber): boolean {
    // Compare normalized E.164 format for equality
    return this.getE164Format() === other.getE164Format();
  }
}

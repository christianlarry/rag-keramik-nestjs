import { AddressLabel } from "../types/address.type";

/**
 * Address Value Object
 * 
 * Represents a physical address as an immutable value object.
 * Identity and lifecycle are managed by the User aggregate root.
 * 
 * @value-object Immutable value object with equality based on all properties
 */
export class AddressVO {
  private readonly _label: AddressLabel;
  private readonly _recipient: string;
  private readonly _phone: string;
  private readonly _street: string;
  private readonly _city: string;
  private readonly _province: string;
  private readonly _postalCode: string;
  private readonly _country: string;
  private readonly _latitude?: number;
  private readonly _longitude?: number;

  constructor(props: AddressVOProps) {
    this.validate(props);

    this._label = props.label;
    this._recipient = props.recipient;
    this._phone = props.phone;
    this._street = props.street;
    this._city = props.city;
    this._province = props.province;
    this._postalCode = props.postalCode;
    this._country = props.country ?? 'Indonesia';
    this._latitude = props.latitude;
    this._longitude = props.longitude;
  }

  // =====================================================
  // Getters
  // =====================================================

  get label(): AddressLabel {
    return this._label;
  }

  get recipient(): string {
    return this._recipient;
  }

  get phone(): string {
    return this._phone;
  }

  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get province(): string {
    return this._province;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get country(): string {
    return this._country;
  }

  get latitude(): number | undefined {
    return this._latitude;
  }

  get longitude(): number | undefined {
    return this._longitude;
  }

  // =====================================================
  // Business Logic (Read-only)
  // =====================================================

  get hasCoordinates(): boolean {
    return this._latitude !== undefined && this._longitude !== undefined;
  }

  get formattedAddress(): string {
    return `${this._street}, ${this._city}, ${this._province} ${this._postalCode}, ${this._country}`;
  }

  get shortAddress(): string {
    return `${this._city}, ${this._province}`;
  }

  /**
   * Calculate distance to another address (if both have coordinates)
   * Uses Haversine formula
   * @returns Distance in kilometers, or null if coordinates are missing
   */
  distanceTo(other: AddressVO): number | null {
    if (!this.hasCoordinates || !other.hasCoordinates) {
      return null;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(other._latitude! - this._latitude!);
    const dLon = this.toRad(other._longitude! - this._longitude!);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this._latitude!)) *
      Math.cos(this.toRad(other._latitude!)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // =====================================================
  // Value Object Equality
  // =====================================================

  /**
   * Value objects are equal if all their properties are equal
   * (excluding isPrimary which is managed by aggregate)
   */
  equals(other: AddressVO): boolean {
    if (!other) return false;

    return (
      this._label === other._label &&
      this._recipient === other._recipient &&
      this._phone === other._phone &&
      this._street === other._street &&
      this._city === other._city &&
      this._province === other._province &&
      this._postalCode === other._postalCode &&
      this._country === other._country &&
      this._latitude === other._latitude &&
      this._longitude === other._longitude
    );
  }

  /**
   * Create a copy with modified properties
   * Since value objects are immutable, we create a new instance
   */
  copyWith(props: Partial<AddressVOProps>): AddressVO {
    return new AddressVO({
      label: props.label ?? this._label,
      recipient: props.recipient ?? this._recipient,
      phone: props.phone ?? this._phone,
      street: props.street ?? this._street,
      city: props.city ?? this._city,
      province: props.province ?? this._province,
      postalCode: props.postalCode ?? this._postalCode,
      country: props.country ?? this._country,
      latitude: props.latitude ?? this._latitude,
      longitude: props.longitude ?? this._longitude,
    });
  }

  // =====================================================
  // Validation
  // =====================================================

  private validate(props: AddressVOProps): void {
    // Required fields
    if (!props.recipient || props.recipient.trim().length === 0) {
      throw new Error('Recipient name is required');
    }

    if (!props.phone || props.phone.trim().length === 0) {
      throw new Error('Phone number is required');
    }

    if (!props.street || props.street.trim().length === 0) {
      throw new Error('Street address is required');
    }

    if (!props.city || props.city.trim().length === 0) {
      throw new Error('City is required');
    }

    if (!props.province || props.province.trim().length === 0) {
      throw new Error('Province is required');
    }

    if (!props.postalCode || props.postalCode.trim().length === 0) {
      throw new Error('Postal code is required');
    }

    // Length validations
    if (props.recipient.length > 100) {
      throw new Error('Recipient name too long (max 100 characters)');
    }

    if (props.street.length > 200) {
      throw new Error('Street address too long (max 200 characters)');
    }

    // Phone format validation (Indonesian)
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(props.phone.replace(/[\s-]/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    // Postal code validation (Indonesian: 5 digits)
    const country = props.country ?? 'Indonesia';
    if (country === 'Indonesia' && !/^\d{5}$/.test(props.postalCode)) {
      throw new Error('Invalid Indonesian postal code format (5 digits required)');
    }

    // Coordinate validations
    if (props.latitude !== undefined) {
      if (props.latitude < -90 || props.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }

    if (props.longitude !== undefined) {
      if (props.longitude < -180 || props.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }

    // Both coordinates should be provided together
    if (
      (props.latitude !== undefined && props.longitude === undefined) ||
      (props.latitude === undefined && props.longitude !== undefined)
    ) {
      throw new Error('Both latitude and longitude must be provided together');
    }
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // =====================================================
  // Serialization
  // =====================================================

  toJSON() {
    return {
      label: this._label,
      recipient: this._recipient,
      phone: this._phone,
      street: this._street,
      city: this._city,
      province: this._province,
      postalCode: this._postalCode,
      country: this._country,
      latitude: this._latitude,
      longitude: this._longitude,
    };
  }
}

/**
 * Props for creating an Address value object
 */
export interface AddressVOProps {
  label: AddressLabel;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}
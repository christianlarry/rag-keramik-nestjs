import { AddressLabel } from "../types/address.type";

/**
 * Address Value Object
 * 
 * Represents a physical address with validation and business rules.
 * Immutable by design (except for isDefault flag which is managed by aggregate).
 * 
 * @value-object Address is a value object with equality based on its properties
 */
export class AddressVO {
  private readonly _id: string;
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
  private _isDefault: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AddressVOProps) {
    this.validate(props);

    this._id = props.id;
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
    this._isDefault = props.isDefault ?? false;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  // =====================================================
  // Getters
  // =====================================================

  get id(): string {
    return this._id;
  }

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

  get isDefault(): boolean {
    return this._isDefault;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // =====================================================
  // Business Logic
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

  // =====================================================
  // Domain Methods
  // =====================================================

  /**
   * Set this address as default
   * Note: Caller is responsible for unsetting other addresses
   */
  setAsDefault(): void {
    this._isDefault = true;
    this._updatedAt = new Date();
  }

  /**
   * Unset this address as default
   */
  unsetAsDefault(): void {
    this._isDefault = false;
    this._updatedAt = new Date();
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
      id: props.id ?? this._id,
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
      isDefault: props.isDefault ?? this._isDefault,
      createdAt: this._createdAt,
      updatedAt: new Date(),
    });
  }

  // =====================================================
  // Validation
  // =====================================================

  private validate(props: AddressVOProps): void {
    if (!props.id) {
      throw new Error('Address ID is required');
    }

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

    // Validate coordinates if provided
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
      id: this._id,
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
      isDefault: this._isDefault,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

/**
 * Props for creating an Address value object
 */
export interface AddressVOProps {
  id: string;
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
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
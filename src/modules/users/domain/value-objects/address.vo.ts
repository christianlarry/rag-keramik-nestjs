import { InvalidAddressError } from "../errors";
import { AddressLabel as AddressLabelEnum } from "../enums/address-label.enum";
import { PhoneNumber } from "./phone-number.vo";

export interface AddressProps {
  label: AddressLabelEnum;
  recipient: string;
  phone: PhoneNumber;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export class Address {
  private readonly props: AddressProps;

  private constructor(props: AddressProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    // Validate label
    if (!Object.values(AddressLabelEnum).includes(this.props.label)) {
      throw new InvalidAddressError(`Invalid address label: ${this.props.label}`);
    }

    // Validate recipient
    if (!this.props.recipient || this.props.recipient.trim().length === 0) {
      throw new InvalidAddressError('Recipient name cannot be empty.');
    }
    if (this.props.recipient.length > 255) {
      throw new InvalidAddressError('Recipient name cannot exceed 255 characters.');
    }

    // Validate street
    if (!this.props.street || this.props.street.trim().length === 0) {
      throw new InvalidAddressError('Street address cannot be empty.');
    }
    if (this.props.street.length > 500) {
      throw new InvalidAddressError('Street address cannot exceed 500 characters.');
    }

    // Validate city
    if (!this.props.city || this.props.city.trim().length === 0) {
      throw new InvalidAddressError('City cannot be empty.');
    }
    if (this.props.city.length > 255) {
      throw new InvalidAddressError('City cannot exceed 255 characters.');
    }

    // Validate province
    if (!this.props.province || this.props.province.trim().length === 0) {
      throw new InvalidAddressError('Province cannot be empty.');
    }
    if (this.props.province.length > 255) {
      throw new InvalidAddressError('Province cannot exceed 255 characters.');
    }

    // Validate postal code
    if (!this.props.postalCode || this.props.postalCode.trim().length === 0) {
      throw new InvalidAddressError('Postal code cannot be empty.');
    }
    if (this.props.postalCode.length > 20) {
      throw new InvalidAddressError('Postal code cannot exceed 20 characters.');
    }
    // Indonesian postal code validation (5 digits)
    if (this.props.country.toLowerCase() === 'indonesia') {
      if (!/^\d{5}$/.test(this.props.postalCode)) {
        throw new InvalidAddressError('Indonesian postal code must be exactly 5 digits.');
      }
    }

    // Validate country
    if (!this.props.country || this.props.country.trim().length === 0) {
      throw new InvalidAddressError('Country cannot be empty.');
    }
    if (this.props.country.length > 100) {
      throw new InvalidAddressError('Country cannot exceed 100 characters.');
    }

    // Validate coordinates if provided
    if (this.props.latitude !== undefined && this.props.latitude !== null) {
      if (this.props.latitude < -90 || this.props.latitude > 90) {
        throw new InvalidAddressError('Latitude must be between -90 and 90 degrees.');
      }
    }
    if (this.props.longitude !== undefined && this.props.longitude !== null) {
      if (this.props.longitude < -180 || this.props.longitude > 180) {
        throw new InvalidAddressError('Longitude must be between -180 and 180 degrees.');
      }
    }

    // If one coordinate is provided, both should be provided
    const hasLat = this.props.latitude !== null;
    const hasLng = this.props.longitude !== null;
    if (hasLat !== hasLng) {
      throw new InvalidAddressError('Both latitude and longitude must be provided together.');
    }
  }

  public static create(props: AddressProps): Address {
    return new Address({
      ...props,
      country: props.country || 'Indonesia',
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      isDefault: props.isDefault ?? false,
    });
  }

  public static createHome(props: Omit<AddressProps, 'label'>): Address {
    return new Address({
      ...props,
      label: AddressLabelEnum.HOME,
      country: props.country || 'Indonesia',
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      isDefault: props.isDefault ?? false,
    });
  }

  public static createOffice(props: Omit<AddressProps, 'label'>): Address {
    return new Address({
      ...props,
      label: AddressLabelEnum.OFFICE,
      country: props.country || 'Indonesia',
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      isDefault: props.isDefault ?? false,
    });
  }

  public static createOther(props: Omit<AddressProps, 'label'>): Address {
    return new Address({
      ...props,
      label: AddressLabelEnum.OTHER,
      country: props.country || 'Indonesia',
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      isDefault: props.isDefault ?? false,
    });
  }

  // Getters
  public getLabel(): AddressLabelEnum {
    return this.props.label;
  }

  public getRecipient(): string {
    return this.props.recipient;
  }

  public getPhone(): string {
    return this.props.phone.getValue();
  }

  public getStreet(): string {
    return this.props.street;
  }

  public getCity(): string {
    return this.props.city;
  }

  public getProvince(): string {
    return this.props.province;
  }

  public getPostalCode(): string {
    return this.props.postalCode;
  }

  public getCountry(): string {
    return this.props.country;
  }

  public getLatitude(): number | null {
    return this.props.latitude ?? null;
  }

  public getLongitude(): number | null {
    return this.props.longitude ?? null;
  }

  public getValue(): AddressProps {
    return { ...this.props };
  }

  // Query methods
  public isHome(): boolean {
    return this.props.label === AddressLabelEnum.HOME;
  }

  public isOffice(): boolean {
    return this.props.label === AddressLabelEnum.OFFICE;
  }

  public isOther(): boolean {
    return this.props.label === AddressLabelEnum.OTHER;
  }

  public hasCoordinates(): boolean {
    return this.props.latitude !== null && this.props.longitude !== null;
  }

  public isIndonesia(): boolean {
    return this.props.country.toLowerCase() === 'indonesia';
  }

  public isDefault(): boolean {
    return this.props.isDefault;
  }

  /**
   * Get full address as single line string
   */
  public getFullAddress(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.province} ${this.props.postalCode}, ${this.props.country}`;
  }

  /**
   * Get formatted address with recipient
   */
  public getFormattedAddress(): string {
    return [
      `${this.props.recipient} (${this.props.phone})`,
      this.props.street,
      `${this.props.city}, ${this.props.province} ${this.props.postalCode}`,
      this.props.country,
    ].join('\n');
  }

  /**
   * Get short address (street, city)
   */
  public getShortAddress(): string {
    return `${this.props.street}, ${this.props.city}`;
  }

  public equals(other: Address): boolean {
    return (
      this.props.label === other.props.label &&
      this.props.recipient === other.props.recipient &&
      this.props.phone === other.props.phone &&
      this.props.street === other.props.street &&
      this.props.city === other.props.city &&
      this.props.province === other.props.province &&
      this.props.postalCode === other.props.postalCode &&
      this.props.country === other.props.country
    );
  }
}

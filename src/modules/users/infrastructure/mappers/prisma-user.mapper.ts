import {
  Gender as PrismaGender,
  Role as PrismaRole,
  UserStatus as PrismaUserStatus,
  AddressLabel as PrismaAddressLabel
} from "src/generated/prisma/enums";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { Name } from "../../domain/value-objects/name.vo";
import { Role } from "../../domain/value-objects/role.vo";
import { Status } from "../../domain/value-objects/status.vo";
import { Gender } from "../../domain/value-objects/gender.vo";
import { PhoneNumber } from "../../domain/value-objects/phone-number.vo";
import { Address } from "../../domain/value-objects/address.vo";
import { Avatar } from "../../domain/value-objects/avatar.vo";
import { DateOfBirth } from "../../domain/value-objects/date-of-birth.vo";
import { createEnumMapper } from "src/core/infrastructure/persistence/mapper/create-enum-mapper";
import { AddressLabel as AddressLabelEnum } from "../../domain/enums/address-label.enum";

// Type alias for Prisma Decimal - will be handled by Prisma at runtime
type PrismaDecimal = any;

interface RawAddress {
  id: string;
  label: PrismaAddressLabel;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: PrismaDecimal | null;
  longitude: PrismaDecimal | null;
  isDefault: boolean;
}

interface RawUser {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: Date | null;
  gender: PrismaGender | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  role: PrismaRole;
  status: PrismaUserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  addresses: RawAddress[];
}

export class PrismaUserMapper {
  /**
   * Map Prisma raw user data to User domain entity
   */
  static toDomain(raw: RawUser): User {
    const name = Name.create(raw.fullName);
    const email = Email.create(raw.email);
    const dateOfBirth = raw.dateOfBirth ? DateOfBirth.create(raw.dateOfBirth) : null;
    const gender = raw.gender ? Gender.create(genderMapper.toEntity(raw.gender)) : null;
    const avatarUrl = raw.avatarUrl ? Avatar.create(raw.avatarUrl) : null;
    const phoneNumber = raw.phoneNumber ? PhoneNumber.create(raw.phoneNumber) : null;
    const role = Role.create(roleMapper.toEntity(raw.role));
    const status = Status.create(statusMapper.toEntity(raw.status));

    const addresses = raw.addresses.map(addr => {
      const phone = PhoneNumber.create(addr.phone);

      return Address.create({
        label: addressLabelMapper.toEntity(addr.label),
        recipient: addr.recipient,
        phone: phone,
        street: addr.street,
        city: addr.city,
        province: addr.province,
        postalCode: addr.postalCode,
        country: addr.country,
        latitude: addr.latitude ? Number(addr.latitude) : null,
        longitude: addr.longitude ? Number(addr.longitude) : null,
        isDefault: addr.isDefault,
      });
    });

    return User.reconstruct(raw.id, {
      name: name,
      dateOfBirth: dateOfBirth,
      gender: gender,
      avatarUrl: avatarUrl,
      phoneNumber: phoneNumber,
      phoneVerified: raw.phoneVerified,
      phoneVerifiedAt: raw.phoneVerifiedAt,
      addresses: addresses,
      email: email,
      role: role,
      status: status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  /**
   * Map User domain entity to Prisma persistence format
   */
  static toPersistence(user: User): Omit<RawUser, 'addresses'> & { addresses: Omit<RawAddress, 'id'>[] } {
    return {
      id: user.id.getValue(),
      fullName: user.name.getFullName(),
      email: user.email.getValue(),
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.getValue() : null,
      gender: user.gender ? genderMapper.toPersistence(user.gender.getValue()) : null,
      avatarUrl: user.avatarUrl ? user.avatarUrl.getValue() : null,
      phoneNumber: user.phoneNumber ? user.phoneNumber.getValue() : null,
      phoneVerified: user.phoneVerified,
      phoneVerifiedAt: user.phoneVerifiedAt,
      role: roleMapper.toPersistence(user.role.getValue()),
      status: statusMapper.toPersistence(user.status.getValue()),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      addresses: user.addresses.map(addr => ({
        label: addressLabelMapper.toPersistence(addr.getLabel()),
        recipient: addr.getRecipient(),
        phone: addr.getPhone(),
        street: addr.getStreet(),
        city: addr.getCity(),
        province: addr.getProvince(),
        postalCode: addr.getPostalCode(),
        country: addr.getCountry(),
        latitude: addr.getLatitude(),
        longitude: addr.getLongitude(),
        isDefault: addr.isDefault(),
      })),
    };
  }
}

// Enum mappers
const roleMapper = createEnumMapper<Role['value'], PrismaRole>({
  customer: 'CUSTOMER',
  admin: 'ADMIN',
  staff: 'STAFF'
});

const statusMapper = createEnumMapper<Status['value'], PrismaUserStatus>({
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  suspended: 'SUSPENDED',
  deleted: 'DELETED'
});

const genderMapper = createEnumMapper<Gender['value'], PrismaGender>({
  male: 'MALE',
  female: 'FEMALE'
});

const addressLabelMapper = createEnumMapper<AddressLabelEnum, PrismaAddressLabel>({
  home: 'HOME',
  office: 'OFFICE',
  other: 'OTHER'
});

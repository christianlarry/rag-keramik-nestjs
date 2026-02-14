import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../../domain/enums/gender.enum';
import { Role } from '../../../domain/enums/role.enum';
import { Status } from '../../../domain/enums/status.enum';
import { AddressLabel } from '../../../domain/enums/address-label.enum';

class AddressResponseDto {
  @ApiProperty({ example: 'HOME', enum: AddressLabel })
  label: AddressLabel;

  @ApiProperty({ example: 'Jl. Merdeka No. 123' })
  street: string;

  @ApiProperty({ example: 'Jakarta' })
  city: string;

  @ApiProperty({ example: 'DKI Jakarta' })
  state: string;

  @ApiProperty({ example: '12345' })
  postalCode: string;

  @ApiProperty({ example: 'Indonesia' })
  country: string;

  @ApiProperty({ example: -6.2088, required: false })
  latitude?: number;

  @ApiProperty({ example: 106.8456, required: false })
  longitude?: number;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'MALE', enum: Gender, required: false, nullable: true })
  gender?: Gender | null;

  @ApiProperty({ example: '1990-01-15', required: false, nullable: true })
  dateOfBirth?: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ example: '+628123456789', required: false, nullable: true })
  phoneNumber?: string | null;

  @ApiProperty({ example: true })
  isPhoneVerified: boolean;

  @ApiProperty({ example: 'CUSTOMER', enum: Role })
  role: Role;

  @ApiProperty({ example: 'ACTIVE', enum: Status })
  status: Status;

  @ApiProperty({ type: [AddressResponseDto], required: false, nullable: true })
  addresses?: AddressResponseDto[] | null;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:30:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<UserProfileResponseDto>) {
    Object.assign(this, partial);
  }
}

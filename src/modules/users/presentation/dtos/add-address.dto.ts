import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { AddressLabel } from '../../domain/enums/address-label.enum';

export class AddAddressDto {
  @ApiProperty({
    example: 'HOME',
    description: 'Address label/type',
    enum: AddressLabel,
  })
  @IsEnum(AddressLabel, { message: 'label must be one of: HOME, WORK, OTHER' })
  @IsNotEmpty()
  label: AddressLabel;

  @ApiProperty({
    example: 'Jl. Merdeka No. 123',
    description: 'Street address',
  })
  @IsString()
  @MinLength(5, { message: 'street must be at least 5 characters long' })
  @MaxLength(200, { message: 'street must be at most 200 characters long' })
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    example: 'Jakarta',
    description: 'City name',
  })
  @IsString()
  @MinLength(2, { message: 'city must be at least 2 characters long' })
  @MaxLength(100, { message: 'city must be at most 100 characters long' })
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'DKI Jakarta',
    description: 'State/Province name',
  })
  @IsString()
  @MinLength(2, { message: 'state must be at least 2 characters long' })
  @MaxLength(100, { message: 'state must be at most 100 characters long' })
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: '12345',
    description: 'Postal/ZIP code',
  })
  @IsString()
  @Matches(/^[0-9]{5,10}$/, { message: 'postalCode must be 5-10 digits' })
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({
    example: 'Indonesia',
    description: 'Country name',
    default: 'Indonesia',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'country must be at least 2 characters long' })
  @MaxLength(100, { message: 'country must be at most 100 characters long' })
  country?: string;

  @ApiProperty({
    example: -6.2088,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'latitude must be a number' })
  @IsLatitude({ message: 'latitude must be a valid latitude coordinate' })
  latitude?: number;

  @ApiProperty({
    example: 106.8456,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'longitude must be a number' })
  @IsLongitude({ message: 'longitude must be a valid longitude coordinate' })
  longitude?: number;

  @ApiProperty({
    example: true,
    description: 'Set as default address',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

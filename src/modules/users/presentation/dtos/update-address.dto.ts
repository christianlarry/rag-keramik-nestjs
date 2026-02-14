import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
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

export class UpdateAddressDto {
  @ApiProperty({
    example: 'HOME',
    description: 'Address label/type',
    enum: AddressLabel,
    required: false,
  })
  @IsOptional()
  @IsEnum(AddressLabel, { message: 'label must be one of: HOME, WORK, OTHER' })
  label?: AddressLabel;

  @ApiProperty({
    example: 'Jl. Merdeka No. 123',
    description: 'Street address',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'street must be at least 5 characters long' })
  @MaxLength(200, { message: 'street must be at most 200 characters long' })
  street?: string;

  @ApiProperty({
    example: 'Jakarta',
    description: 'City name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'city must be at least 2 characters long' })
  @MaxLength(100, { message: 'city must be at most 100 characters long' })
  city?: string;

  @ApiProperty({
    example: 'DKI Jakarta',
    description: 'State/Province name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'state must be at least 2 characters long' })
  @MaxLength(100, { message: 'state must be at most 100 characters long' })
  state?: string;

  @ApiProperty({
    example: '12345',
    description: 'Postal/ZIP code',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{5,10}$/, { message: 'postalCode must be 5-10 digits' })
  postalCode?: string;

  @ApiProperty({
    example: 'Indonesia',
    description: 'Country name',
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
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

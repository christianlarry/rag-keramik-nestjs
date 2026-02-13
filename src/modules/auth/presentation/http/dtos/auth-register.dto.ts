import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength
} from "class-validator";

/*
export class RegisterAddressDto {
  @ApiProperty({ example: 'Home', description: 'Label for the address', enum: AddressLabel })
  @IsNotEmpty()
  @IsEnum(AddressLabel, {
    message: `label must be one of the following values: ${Object.values(AddressLabel).join(', ').toLowerCase()}`,
  })
  @Transform((val) => val.value?.toUpperCase()?.trim())
  label: AddressLabel;

  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ example: '+6281234567890', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Jl. Jend. Sudirman No. 1', description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Jakarta Selatan', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'DKI Jakarta', description: 'Province' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: '12190', description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'Indonesia', description: 'Country', default: 'Indonesia', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: -6.2088, description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ example: 106.8456, description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ example: true, description: 'Set as default address', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
*/

export class AuthRegisterDto {

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters long' })
  @MaxLength(255, { message: 'fullName must be at most 255 characters long' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address of the user' })
  @Transform((val) => val.value?.toLowerCase()?.trim()) // Normalize email
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd123!', description: 'Password for the user account' })
  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  /*
  @ApiProperty({ example: 'male', description: 'Gender of the user', enum: Gender })
  @IsNotEmpty()
  @Transform((val) => val.value?.toUpperCase()?.trim())
  @IsEnum(Gender, {
    message: `gender must be one of the following values: ${Object.values(Gender).join(', ').toLowerCase()}`,
  })
  gender: Gender;

  @ApiProperty({ type: RegisterAddressDto, required: false, description: 'User address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterAddressDto)
  address?: RegisterAddressDto;

  @IsOptional()
  @IsString()
  @IsPhoneNumber("ID", { message: 'phoneNumber must be a valid Indonesian phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;
  */
}
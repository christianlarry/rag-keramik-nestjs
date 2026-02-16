import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Gender } from '../../domain/enums/gender.enum';

export class UpdateUserProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    required: false,
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'fullName must be at least 3 characters long' })
  @MaxLength(100, { message: 'fullName must be at most 100 characters long' })
  @Matches(/^[a-zA-Zà-žÀ-Ž'´`-]{3,}([ ][a-zA-Zà-žÀ-Ž'´`-]{1,})*$/, {
    message: 'fullName contains invalid characters or format',
  })
  fullName?: string;

  @ApiProperty({
    example: 'MALE',
    description: 'Gender of the user',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be one of: MALE, FEMALE' })
  gender?: Gender;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Date of birth in ISO 8601 format (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string' })
  dateOfBirth?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @ApiProperty({
    example: '+628123456789',
    description: 'Phone number with country code',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid phone number with country code',
  })
  phoneNumber?: string;
}

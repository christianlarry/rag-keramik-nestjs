import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current password of the user',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password. Must contain at least 8 characters, including uppercase, lowercase, number, and special character.',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({}, { message: 'New password is not strong enough' })
  newPassword: string;
}
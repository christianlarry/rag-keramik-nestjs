import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: 'StrongP@ssw0rd123!',
    description: 'New password. Must contain at least 8 characters, including uppercase, lowercase, number, and special character.',
    minLength: 8,
  })
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
    description: 'Password reset token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

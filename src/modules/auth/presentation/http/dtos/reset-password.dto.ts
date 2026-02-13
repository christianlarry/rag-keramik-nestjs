import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: 'StrongP@ssw0rd123!', description: 'New password' })
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ example: 'abc123xyz...', description: 'Reset token received via email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

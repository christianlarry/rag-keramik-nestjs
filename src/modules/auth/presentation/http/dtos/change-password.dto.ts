import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword!', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({}, { message: 'New password is not strong enough' })
  newPassword: string;
}
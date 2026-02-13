import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address to resend verification to' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address of the user' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123xyz...', description: 'Verification token received via email' })
  @IsNotEmpty()
  @IsString()
  token: string;
}

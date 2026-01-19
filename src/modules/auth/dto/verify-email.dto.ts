import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsNotEmpty } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123xyz...', description: 'Verification token received via email' })
  @IsNotEmpty()
  @IsJWT()
  token: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123xyz...', description: 'Verification hash/token received via email' })
  @IsString()
  @IsNotEmpty()
  hash: string;
}

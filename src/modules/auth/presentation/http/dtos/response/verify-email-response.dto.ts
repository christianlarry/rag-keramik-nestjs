import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: 'Email verified successfully. Your account is now active.',
    description: 'Success message',
  })
  message: string;

  constructor(data: VerifyEmailResponseDto) {
    Object.assign(this, data);
  }
}
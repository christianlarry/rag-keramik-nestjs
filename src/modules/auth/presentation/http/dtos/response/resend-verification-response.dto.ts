import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationResponseDto {
  @ApiProperty({
    example: 'Verification email resent. Please check your email.',
    description: 'Success message',
  })
  message: string;

  constructor(data: ResendVerificationResponseDto) {
    this.message = data.message;
  }
}
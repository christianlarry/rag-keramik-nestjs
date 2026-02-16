import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If an account with that email exists, a password reset link has been sent.',
    description: 'Success message',
  })
  message: string;

  constructor(data: ForgotPasswordResponseDto) {
    Object.assign(this, data)
  }
}
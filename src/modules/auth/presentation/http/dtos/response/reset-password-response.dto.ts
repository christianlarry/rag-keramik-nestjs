import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    example: 'Password has been reset successfully.',
    description: 'Success message',
  })
  message: string;

  constructor(data: ResetPasswordResponseDto) {
    Object.assign(this, data);
  }
}
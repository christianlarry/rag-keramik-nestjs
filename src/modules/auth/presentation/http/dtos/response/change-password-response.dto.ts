import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({
    example: 'Password changed successfully.',
    description: 'Success message',
  })
  message: string;

  constructor(data: { message?: string }) {
    this.message = data.message || 'Password changed successfully';
  }
}
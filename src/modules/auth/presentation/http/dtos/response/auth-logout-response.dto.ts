import { ApiProperty } from '@nestjs/swagger';

export class AuthLogoutResponseDto {
  @ApiProperty({
    example: 'Logged out successfully.',
    description: 'Success message',
  })
  message: string;

  constructor(data: AuthLogoutResponseDto) {
    Object.assign(this, data);
  }
}
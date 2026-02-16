import { ApiProperty } from '@nestjs/swagger';

class GoogleUserInfoDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  fullName: string;
}

export class AuthGoogleCallbackResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'JWT access token for authentication',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    description: 'JWT refresh token for obtaining new access tokens',
  })
  refreshToken: string;

  @ApiProperty({
    type: GoogleUserInfoDto,
    description: 'Basic user information from Google',
  })
  user: GoogleUserInfoDto;

  constructor(data: AuthGoogleCallbackResponseDto) {
    Object.assign(this, data);
  }
}
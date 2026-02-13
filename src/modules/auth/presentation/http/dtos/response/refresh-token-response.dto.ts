export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;

  constructor(data: RefreshTokenResponseDto) {
    Object.assign(this, data)
  }
}
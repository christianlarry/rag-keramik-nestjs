export class RefreshTokenResponseDto {
  token: string;
  refreshToken: string;

  constructor(data: RefreshTokenResponseDto) {
    Object.assign(this, data)
  }
}
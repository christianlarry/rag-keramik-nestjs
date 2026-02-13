export class AuthLogoutResponseDto {
  message: string;

  constructor(data: AuthLogoutResponseDto) {
    Object.assign(this, data);
  }
}
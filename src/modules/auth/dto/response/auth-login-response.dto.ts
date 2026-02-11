export class AuthLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: Record<string, any>; // Replace 'any' with the actual UserResponseDto type when imported

  constructor(data: AuthLoginResponseDto) {
    Object.assign(this, data);
  }
}
export class AuthGoogleCallbackResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  }

  constructor(data: AuthGoogleCallbackResponseDto) {
    Object.assign(this, data);
  }
}
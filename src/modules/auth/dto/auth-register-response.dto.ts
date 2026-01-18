export class AuthRegisterResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;

  constructor(partial: Partial<AuthRegisterResponseDto>) {
    Object.assign(this, partial);
  }
}
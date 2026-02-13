export class AuthRegisterResponseDto {
  id: string;
  message: string;

  constructor(data: AuthRegisterResponseDto) {
    Object.assign(this, data);
  }
}
export class ForgotPasswordResponseDto {
  message: string;

  constructor(data: ForgotPasswordResponseDto) {
    Object.assign(this, data)
  }
}
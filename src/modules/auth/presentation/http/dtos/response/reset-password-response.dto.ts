export class ResetPasswordResponseDto {
  message: string;

  constructor(data: ResetPasswordResponseDto) {
    Object.assign(this, data);
  }
}
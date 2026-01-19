export class VerifyEmailResponseDto {
  message: string;

  constructor(data: VerifyEmailResponseDto) {
    Object.assign(this, data);
  }
}
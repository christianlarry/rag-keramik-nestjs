export class ResendVerificationResponseDto {
  message: string;

  constructor(data: ResendVerificationResponseDto) {
    this.message = data.message;
  }
}
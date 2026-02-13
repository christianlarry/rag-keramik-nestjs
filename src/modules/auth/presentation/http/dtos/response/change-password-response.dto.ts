export class ChangePasswordResponseDto {
  message: string;

  constructor(data: { message?: string }) {
    this.message = data.message || 'Password changed successfully';
  }
}
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor() { }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    // Implement email sending logic here
    console.log(`Sending verification email to ${to} with token: ${token}`);
  }

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    // Implement email sending logic here
    console.log(`Sending reset password email to ${to} with token: ${token}`);
  }
}
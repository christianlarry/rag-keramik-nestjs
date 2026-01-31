import { Email } from "../value-objects/email.vo";

export interface AuthAccountProps {
  userId: string;
  email: Email;
  provider: string;
  providerId: string | null;
  role: string;
  refreshTokens: string[];
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: string;
  passwordChangedAt: Date | null;
  status: string;
  failedLoginAttempts: number;
}
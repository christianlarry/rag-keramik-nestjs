import { AuthProvider } from "../value-objects/auth-provider.vo";
import { Email } from "../value-objects/email.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "../value-objects/role.vo";
import { Status } from "../value-objects/status.vo";

export interface CreateAuthAccountProps {
  id: string;
  email: Email;
  provider: AuthProvider;
  providerId: string | null;
  role: Role;
  refreshTokens: string[];
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: Password | null;
  passwordChangedAt: Date | null;
  status: Status;
  failedLoginAttempts: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}
import { AuthUser } from "../entities/auth-user.entity";

export interface AuthUserRepository {
  findById(userId: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  isEmailExisting(email: string): Promise<boolean>;
  save(user: AuthUser): Promise<void>;
}

export const AUTH_USER_REPOSITORY_TOKEN = "AUTH_USER_REPOSITORY";
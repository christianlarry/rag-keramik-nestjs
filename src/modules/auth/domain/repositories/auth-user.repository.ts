import { AuthUser } from "../entities/auth-user.entity";

export interface AuthUserRepository {
  findById(userId: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  save(user: AuthUser): Promise<void>;
}
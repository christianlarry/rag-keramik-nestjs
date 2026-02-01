import { AuthAccount } from "../entities/auth-account.entity";

export interface AuthAccountRepository {
  findById(id: string): Promise<AuthAccount | null>;
  findByEmail(email: string): Promise<AuthAccount | null>;
  emailExists(email: string): Promise<boolean>;
  save(account: AuthAccount): Promise<void>;
}
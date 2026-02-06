import { PasswordHasher } from "../../domain/services/password-hasher.interface";
import bcrypt from "bcrypt";

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(raw, hashed);
  }
}
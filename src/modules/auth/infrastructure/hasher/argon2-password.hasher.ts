import { PasswordHasher } from "../../domain/services/password-hasher.interface";
import argon2 from 'argon2';

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,  // Recommended for most use cases
      memoryCost: 2 ** 16,    // 64 MB
      timeCost: 3,            // Number of iterations  
      parallelism: 4,         // Number of parallel threads
    });
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return await argon2.verify(hashed, raw);
  }
}
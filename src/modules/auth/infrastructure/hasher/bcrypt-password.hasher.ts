import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "../../domain/hasher/password-hasher.interface";
import bcrypt from 'bcrypt'

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {

  readonly SALT_ROUNDS: number = 10;

  hash(plainText: string): string {
    const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
    return bcrypt.hashSync(plainText, salt);
  }

  compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
export interface PasswordHasher {
  readonly SALT_ROUNDS: number;
  hash(plainText: string): string;
  compare(plainText: string, hashed: string): Promise<boolean>;
}

export const PASSWORD_HASHER = 'PASSWORD_HASHER';
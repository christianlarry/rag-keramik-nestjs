export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(raw: string, hashed: string): Promise<boolean>;
}

export const PASSWORD_HASHER_TOKEN = "PASSWORD_HASHER";
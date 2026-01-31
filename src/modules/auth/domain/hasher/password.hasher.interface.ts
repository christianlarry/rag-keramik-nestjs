export interface PasswordHasher {
  hash(plainText: string): string;
  compare(plainText: string, hashed: string): Promise<boolean>;
}
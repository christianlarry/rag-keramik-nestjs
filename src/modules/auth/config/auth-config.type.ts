export type AuthConfig = {
  accessTokenExpirationMinutes: number;
  refreshTokenExpirationDays: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
}
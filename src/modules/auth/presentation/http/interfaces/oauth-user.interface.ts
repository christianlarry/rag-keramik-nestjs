export interface OAuthUser {
  email: string;
  fullName: string;
  picture: string | null;
  providerId: string;
  provider: string;
}
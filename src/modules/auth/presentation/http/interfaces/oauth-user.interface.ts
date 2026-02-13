export interface OAuthUser {
  email: string;
  name: string;
  picture: string | null;
  providerId: string;
  provider: string;
}
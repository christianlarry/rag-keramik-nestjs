export interface OAuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string | null;
  providerId: string;
  provider: string;
}
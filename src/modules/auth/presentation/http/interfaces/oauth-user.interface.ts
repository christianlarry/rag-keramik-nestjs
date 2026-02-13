export interface OAuthUser {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  picture: string | null;
  providerId: string;
  provider: string;
}
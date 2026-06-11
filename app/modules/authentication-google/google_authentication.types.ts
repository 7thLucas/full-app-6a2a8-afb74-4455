export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
}

export interface PublicGoogleUser {
  id: string;
  google_id: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  user_id: string;
  last_login_at?: string;
  createdAt: string;
}

export interface GoogleAuthApiResponse {
  success: boolean;
  message?: string;
  unlinked?: boolean;
}

import crypto from "node:crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { parse as parseCookies, serialize as serializeCookie } from "cookie";
import type { GoogleProfile, GoogleTokenResponse } from "./google_authentication.types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const STATE_COOKIE = "g_oauth_state";
export const VERIFIER_COOKIE = "g_oauth_verifier";
export const REDIRECT_COOKIE = "g_oauth_redirect";

const TRANSIENT_MAX_AGE = 5 * 60; // 5 minutes

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getClientId(): string {
  return requireEnv("GOOGLE_CLIENT_ID");
}

export function getClientSecret(): string {
  return requireEnv("GOOGLE_CLIENT_SECRET");
}

export function getRedirectUri(): string {
  return requireEnv("GOOGLE_REDIRECT_URI");
}

export function getScopes(): string {
  return process.env.GOOGLE_OAUTH_SCOPES ?? "openid email profile";
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateState(): string {
  return base64url(crypto.randomBytes(32));
}

export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function buildAuthorizationUrl(params: {
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getScopes());
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

function transientCookie(name: string, value: string, maxAge: number): string {
  return serializeCookie(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function buildTransientCookies(args: {
  state: string;
  verifier: string;
  redirectTo?: string;
}): string[] {
  const cookies = [
    transientCookie(STATE_COOKIE, args.state, TRANSIENT_MAX_AGE),
    transientCookie(VERIFIER_COOKIE, args.verifier, TRANSIENT_MAX_AGE),
  ];
  if (args.redirectTo) {
    cookies.push(transientCookie(REDIRECT_COOKIE, args.redirectTo, TRANSIENT_MAX_AGE));
  }
  return cookies;
}

export function buildClearTransientCookies(): string[] {
  return [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE].map((name) =>
    serializeCookie(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
  );
}

export function readTransientCookies(cookieHeader: string | undefined): {
  state: string | null;
  verifier: string | null;
  redirectTo: string | null;
} {
  if (!cookieHeader) return { state: null, verifier: null, redirectTo: null };
  const cookies = parseCookies(cookieHeader);
  return {
    state: cookies[STATE_COOKIE] ?? null,
    verifier: cookies[VERIFIER_COOKIE] ?? null,
    redirectTo: cookies[REDIRECT_COOKIE] ?? null,
  };
}

export async function exchangeCodeForTokens(args: {
  code: string;
  codeVerifier: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    code_verifier: args.codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function verifyIdToken(idToken: string): Promise<GoogleProfile> {
  const client = new OAuth2Client(getClientId());
  const ticket = await client.verifyIdToken({
    idToken,
    audience: getClientId(),
  });
  const payload: TokenPayload | undefined = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google ID token");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified === true,
    name: payload.name,
    given_name: payload.given_name,
    family_name: payload.family_name,
    picture: payload.picture,
    locale: payload.locale,
  };
}

// Only allow same-origin paths to avoid open-redirect.
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

import type { Request, Response } from "express";
import { GoogleAuthService } from "./google_authentication.service";
import {
  buildAuthorizationUrl,
  buildClearTransientCookies,
  buildTransientCookies,
  exchangeCodeForTokens,
  generatePkcePair,
  generateState,
  readTransientCookies,
  safeRedirectPath,
  verifyIdToken,
} from "./google_authentication.server";
import { signJwt, buildAuthCookie } from "~/modules/authentication/authentication.server";

export async function startLogin(req: Request, res: Response): Promise<void> {
  try {
    const state = generateState();
    const { verifier, challenge } = generatePkcePair();
    const redirectTo = safeRedirectPath(
      typeof req.query.redirect === "string" ? req.query.redirect : null,
      ""
    );

    const transientCookies = buildTransientCookies({
      state,
      verifier,
      redirectTo: redirectTo || undefined,
    });
    for (const c of transientCookies) res.append("Set-Cookie", c);

    const url = buildAuthorizationUrl({ state, codeChallenge: challenge });
    res.redirect(302, url);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to start Google login" });
  }
}

export async function callback(req: Request, res: Response): Promise<void> {
  const fallback = process.env.APP_URL ?? "/";
  try {
    const { state, verifier, redirectTo } = readTransientCookies(req.headers.cookie);
    const queryState = typeof req.query.state === "string" ? req.query.state : null;
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const errorParam = typeof req.query.error === "string" ? req.query.error : null;

    if (errorParam) throw Object.assign(new Error(`Google returned error: ${errorParam}`), { statusCode: 400 });
    if (!state || !queryState || state !== queryState) {
      throw Object.assign(new Error("Invalid OAuth state"), { statusCode: 400 });
    }
    if (!verifier) throw Object.assign(new Error("Missing PKCE verifier"), { statusCode: 400 });
    if (!code) throw Object.assign(new Error("Missing authorization code"), { statusCode: 400 });

    const tokens = await exchangeCodeForTokens({ code, codeVerifier: verifier });
    const profile = await verifyIdToken(tokens.id_token);
    const { user } = await GoogleAuthService.findOrCreateGoogleUserAndLink(profile);

    const jwt = signJwt({
      sub: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
      email_verified: user.email_verified,
    });

    res.append("Set-Cookie", buildAuthCookie(jwt, req.hostname));
    for (const c of buildClearTransientCookies()) res.append("Set-Cookie", c);

    const target = safeRedirectPath(redirectTo, fallback);
    res.redirect(302, target);
  } catch (error: any) {
    // Clear transient cookies even on failure.
    for (const c of buildClearTransientCookies()) res.append("Set-Cookie", c);
    const status = error.statusCode ?? 500;
    res.status(status).json({ success: false, message: error.message ?? "Google login failed" });
  }
}

export async function unlink(req: Request, res: Response): Promise<void> {
  try {
    const removed = await GoogleAuthService.unlink(req.user!.id);
    res.json({ success: true, unlinked: removed });
  } catch (error: any) {
    res.status(error.statusCode ?? 500).json({ success: false, message: error.message ?? "Unlink failed" });
  }
}

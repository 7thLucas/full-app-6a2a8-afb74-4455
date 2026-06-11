# @qb/google_authentication

Google OAuth 2.0 sign-in module for Remix v2 + Express + MongoDB/Typegoose projects.

## What it provides

- **`tbl_google_users` collection** — stores Google identities (sub, profile fields), each linked to a row in `tbl_users` via `user_id`
- **Server-side authorization-code flow** with PKCE (S256) and `state` validation
- **Express endpoints** under `/api/google-auth/*` (auto-discovered)
- **`<GoogleLoginButton />`** React component (shadcn `Button` styled with the Google `G` mark)
- **Integration with `@qb/authentication`**: a successful Google sign-in issues the same `auth_token` JWT cookie, so the existing `requireAuth`, `useAuth()`, and `getUserFromRequest()` keep working unchanged

## How it links to `@qb/authentication`

Every Google identity is bound to exactly one User row in `tbl_users`:

1. On callback, the module looks up `tbl_google_users.google_id`.
2. If not found, it looks up `tbl_users.email`. If a User exists, the new Google identity is linked to it (so password and Google sign-in resolve to the same account).
3. If no User exists, one is created with a random unguessable password hash, role `authenticated`, and `email_verified` mirrored from Google.
4. A JWT is signed via `signJwt()` from `@qb/authentication` and the same `auth_token` cookie is set.

The `User` row is never deleted by this module — even on `unlink`, the User remains and can still authenticate via password.

## Prerequisites

- `@qb/authentication` installed in the project (declared in `qb_package.json`).
- shadcn/ui `button` component (already required by `@qb/authentication`).

### npm packages

```bash
npm install google-auth-library cookie
npm install -D @types/cookie
```

## Environment variables

Merge the contents of `.env.example` into the project root `.env`:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | Must match the URI registered on the OAuth client (e.g. `http://localhost:3000/api/google-auth/callback`) |
| `GOOGLE_OAUTH_SCOPES` | (optional) space-separated scopes, defaults to `openid email profile` |

The module also reads `JWT_SECRET`, `JWT_EXPIRES_IN`, and `APP_URL` — these are owned by `@qb/authentication` and not duplicated here.

## Integration steps

### Step 1 — Place the module

Place this folder at `app/modules/google_authentication/`.

### Step 2 — Install prerequisites

Install npm packages as described above. Make sure `@qb/authentication` is also installed.

### Step 3 — Register an OAuth client

In [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application). Add the authorized redirect URI:

```
http://localhost:3000/api/google-auth/callback
```

Copy the Client ID and Client Secret into `.env`.

### Step 4 — Drop the button into your login UI

```tsx
import { LoginCard } from "~/modules/authentication";
import { GoogleLoginButton } from "~/modules/google_authentication";

export default function LoginRoute() {
  return (
    <div className="space-y-4">
      <LoginCard />
      <GoogleLoginButton redirectTo="/" />
    </div>
  );
}
```

No further wiring is needed — Express routes are auto-discovered.

## API reference

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `GET`  | `/api/google-auth/login` | No | Starts the OAuth flow. Optional `?redirect=/path` for the post-login destination. |
| `GET`  | `/api/google-auth/callback` | No | Google redirects here. Verifies state + PKCE, exchanges the code, sets `auth_token`. |
| `POST` | `/api/google-auth/unlink` | Yes | Removes the Google identity for the current user. The User row is preserved. |

## Component reference

### `<GoogleLoginButton redirectTo? label? />`

Renders a shadcn `Button` (variant `outline`) wrapping an `<a href="/api/google-auth/login">`. No client JS — clicking the link kicks off the server-side redirect.

| Prop | Description |
|------|-------------|
| `redirectTo` | Same-origin path to land on after sign-in. Open-redirect attempts (absolute or `//host`) are stripped server-side. |
| `label` | Override the visible button text. Defaults to `"Continue with Google"`. |

## Schema — `tbl_google_users`

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `google_id` | String | Required, unique — Google `sub` |
| `email` | String | Required, lowercase, indexed |
| `email_verified` | Boolean | |
| `name`, `given_name`, `family_name`, `picture`, `locale` | String? | From `id_token` |
| `user_id` | ObjectId (ref `User`) | Required, indexed — link to `tbl_users` |
| `last_login_at` | Date? | |
| `createdAt`, `updatedAt`, `deletedAt` | Date | Inherited from `CommonTypegooseEntity` |

## Security notes

- **PKCE (S256)** + cryptographically random `state` — both validated on callback.
- **`id_token` verification** uses `google-auth-library`'s `OAuth2Client.verifyIdToken`, which checks signature, `iss`, `aud`, and expiry against Google's published JWKS.
- **Transient cookies** (`g_oauth_state`, `g_oauth_verifier`, `g_oauth_redirect`) are `HttpOnly`, `SameSite=Lax`, `Secure` in production, and expire after 5 minutes.
- **Open-redirect protection**: only same-origin paths (must start with `/` and not `//`) are honored as the post-login redirect target; everything else falls back to `APP_URL`.
- **Refresh / access tokens are not persisted** in v1. Add storage if you later need to call Google APIs on the user's behalf.

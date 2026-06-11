import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Types } from "mongoose";
import type { DocumentType } from "@typegoose/typegoose";
import { GoogleUserModel, GoogleUser } from "./google_authentication.model";
import { UserModel, User } from "~/modules/authentication/authentication.model";
import { UserRole, type PublicUser } from "~/modules/authentication/authentication.types";
import type { GoogleProfile, PublicGoogleUser } from "./google_authentication.types";

function makeError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

function toPublicUser(user: DocumentType<User>): PublicUser {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    email_verified: user.email_verified ?? false,
    profile: user.profile ?? {},
    createdAt: (user.createdAt as Date).toISOString(),
  };
}

function toPublicGoogleUser(g: DocumentType<GoogleUser>): PublicGoogleUser {
  return {
    id: g._id.toString(),
    google_id: g.google_id,
    email: g.email,
    email_verified: g.email_verified,
    name: g.name,
    picture: g.picture,
    user_id: (g.user_id as Types.ObjectId).toString(),
    last_login_at: g.last_login_at ? g.last_login_at.toISOString() : undefined,
    createdAt: (g.createdAt as Date).toISOString(),
  };
}

async function deriveUniqueUsername(email: string): Promise<string> {
  const base = email.split("@")[0]!.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "user";
  let candidate = base;
  for (let i = 0; i < 10; i++) {
    const exists = await UserModel.findOne({ username: candidate });
    if (!exists) return candidate;
    candidate = `${base}_${crypto.randomBytes(2).toString("hex")}`;
  }
  return `${base}_${crypto.randomBytes(4).toString("hex")}`;
}

export class GoogleAuthService {
  /**
   * Resolve (or create) the User row backing this Google identity, then
   * upsert the GoogleUser link. Returns the linked PublicUser so the
   * caller can sign a JWT compatible with @qb/authentication.
   */
  static async findOrCreateGoogleUserAndLink(profile: GoogleProfile): Promise<{
    user: PublicUser;
    googleUser: PublicGoogleUser;
  }> {
    if (!profile.email) throw makeError("Google profile has no email", 400);

    const existing = await GoogleUserModel.findOne({ google_id: profile.sub });
    if (existing) {
      const user = await UserModel.findById(existing.user_id);
      if (!user) throw makeError("Linked user not found", 500);
      if (!user.is_active) throw makeError("Account is inactive", 403);

      existing.last_login_at = new Date();
      // Refresh profile fields in case they changed in Google.
      existing.email = profile.email.toLowerCase();
      existing.email_verified = profile.email_verified;
      existing.name = profile.name;
      existing.given_name = profile.given_name;
      existing.family_name = profile.family_name;
      existing.picture = profile.picture;
      existing.locale = profile.locale;
      await existing.save();

      return { user: toPublicUser(user), googleUser: toPublicGoogleUser(existing) };
    }

    // Find-or-create User by email.
    let user = await UserModel.findOne({ email: profile.email.toLowerCase() });
    if (user) {
      if (!user.is_active) throw makeError("Account is inactive", 403);
      if (profile.email_verified && !user.email_verified) {
        user.email_verified = true;
        await user.save();
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const password_hash = await bcrypt.hash(randomPassword, 12);
      const username = await deriveUniqueUsername(profile.email);
      user = await UserModel.create({
        username,
        email: profile.email,
        password_hash,
        role: UserRole.Authenticated,
        is_active: true,
        email_verified: profile.email_verified,
      });
    }

    const googleUser = await GoogleUserModel.create({
      google_id: profile.sub,
      email: profile.email.toLowerCase(),
      email_verified: profile.email_verified,
      name: profile.name,
      given_name: profile.given_name,
      family_name: profile.family_name,
      picture: profile.picture,
      locale: profile.locale,
      user_id: user._id,
      last_login_at: new Date(),
    });

    return { user: toPublicUser(user), googleUser: toPublicGoogleUser(googleUser) };
  }

  static async unlink(userId: string): Promise<boolean> {
    const result = await GoogleUserModel.findOneAndDelete({ user_id: new Types.ObjectId(userId) });
    return result !== null;
  }
}

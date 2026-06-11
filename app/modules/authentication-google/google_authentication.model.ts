import { prop, getModelForClass, modelOptions, Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";
import { User } from "~/modules/authentication/authentication.model";

@modelOptions({
  schemaOptions: {
    collection: "tbl_google_users",
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
})
export class GoogleUser extends CommonTypegooseEntity {
  @prop({ type: String, required: true, unique: true })
  google_id!: string;

  @prop({ type: String, required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @prop({ type: Boolean, default: false })
  email_verified!: boolean;

  @prop({ type: String, required: false })
  name?: string;

  @prop({ type: String, required: false })
  given_name?: string;

  @prop({ type: String, required: false })
  family_name?: string;

  @prop({ type: String, required: false })
  picture?: string;

  @prop({ type: String, required: false })
  locale?: string;

  // Link to tbl_users — every Google identity is bound to exactly one User row
  // so password and Google sign-in resolve to the same account.
  @prop({ ref: () => User, type: Types.ObjectId, required: true, index: true })
  user_id!: Ref<User>;

  @prop({ type: Date, required: false, default: null })
  last_login_at?: Date | null;
}

export const GoogleUserModel = getModelForClass(GoogleUser);
